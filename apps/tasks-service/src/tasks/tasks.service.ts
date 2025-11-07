import { Injectable, HttpStatus, Inject } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource, SelectQueryBuilder } from 'typeorm'
import { ClientProxy } from '@nestjs/microservices'
import { PinoLogger } from 'nestjs-pino'
import {
  Task,
  PaginatedTasks,
  Status,
  ErrorCode,
} from '@repo/types'
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilters,
} from '@repo/dto'
import { Task as TaskEntity } from '../entities/task.entity';
import { TaskAssignee } from '../entities/task-assignee.entity';
import { EventPublisherService } from '../events/event-publisher.service';
import { AuditService } from '../audit/audit.service';
import { TaskCreatedEvent, TaskUpdatedEvent } from '@repo/messaging';
import { throwRpcError } from '@repo/utils';
import { TASKS_ERRORS } from './constants/tasks.constants';
import { PAGINATION_CONFIG, SORT_ORDER } from '../constants/config.constants';
import { v4 as uuidv4 } from 'uuid';
import { firstValueFrom } from 'rxjs'

type UserDto = {
  id: string;
  username: string;
  email: string;
};

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
    @InjectRepository(TaskAssignee)
    private readonly taskAssigneeRepository: Repository<TaskAssignee>,
    private readonly eventPublisher: EventPublisherService,
    private readonly auditService: AuditService,
    private readonly dataSource: DataSource,
    @Inject('AUTH') private readonly authClient: ClientProxy,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TasksService.name);
  }

  private async fetchUsernames(userIds: string[]): Promise<Map<string, string>> {
    if (userIds.length === 0) return new Map()

    const usernameMap = new Map<string, string>()
    try {
      const response = await firstValueFrom(
        this.authClient.send<{ users: UserDto[] }>('user.list', { ids: userIds }),
      )
      response?.users?.forEach((user: UserDto) => {
        usernameMap.set(user.id, user.username)
      })
    } catch (error) {
      this.logger.error({ error, userIds }, 'Falha ao buscar nomes dos responsáveis')
    }
    return usernameMap
  }

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    if (!createTaskDto.createdBy) {
      throwRpcError(
        HttpStatus.BAD_REQUEST,
        TASKS_ERRORS.CREATED_BY_REQUIRED,
        ErrorCode.VALIDATION_FAILED,
      );
    }

    const createdBy = createTaskDto.createdBy;
    const correlationId = createTaskDto.correlationId ?? uuidv4();
    const assignedUserIds = createTaskDto.assignedUserIds ?? [];
    const uniqueAssigneeIds = [...new Set(assignedUserIds)];

    let creatorName: string | undefined
    try {
      const userResponse = await firstValueFrom(
        this.authClient.send('user.list', { ids: [createdBy] }),
      )
      creatorName = userResponse?.users?.[0]?.username
      if (!creatorName) {
        throwRpcError(
          HttpStatus.BAD_REQUEST,
          TASKS_ERRORS.INVALID_CREATED_BY,
          ErrorCode.VALIDATION_FAILED,
        )
      }
    } catch (error) {
      this.logger.error({ error, createdBy }, 'Falha ao buscar nome do criador')
      throwRpcError(
        HttpStatus.BAD_REQUEST,
        TASKS_ERRORS.INVALID_CREATED_BY,
        ErrorCode.VALIDATION_FAILED,
      )
    }

    let assigneeUsernameMap: Map<string, string> = new Map()
    if (uniqueAssigneeIds.length > 0) {
      assigneeUsernameMap = await this.fetchUsernames(uniqueAssigneeIds)
      const missingAssignees = uniqueAssigneeIds.filter(
        (id) => !assigneeUsernameMap.has(id),
      )
      if (missingAssignees.length > 0) {
        throwRpcError(
          HttpStatus.BAD_REQUEST,
          TASKS_ERRORS.INVALID_ASSIGNEES,
          ErrorCode.VALIDATION_FAILED,
        )
      }
    }

    const { taskWithAssignees, savedTaskId, event } = await this.dataSource.transaction(async (manager) => {
      const task = manager.create(TaskEntity, {
        title: createTaskDto.title.trim(),
        description: createTaskDto.description?.trim(),
        deadline: createTaskDto.deadline,
        priority: createTaskDto.priority,
        status: createTaskDto.status ?? Status.TODO,
        createdBy,
        creatorName,
      });

      const savedTask = await manager.save(task);

      if (uniqueAssigneeIds.length > 0) {
        const assignees = uniqueAssigneeIds.map((userId) =>
          manager.create(TaskAssignee, {
            taskId: savedTask.id,
            userId,
            username: assigneeUsernameMap.get(userId),
            assignedBy: createdBy,
          }),
        );
        await manager.save(TaskAssignee, assignees);
      }

      const event: TaskCreatedEvent = {
        id: savedTask.id,
        title: savedTask.title,
        description: savedTask.description,
        deadline: savedTask.deadline
          ? new Date(savedTask.deadline).toISOString()
          : undefined,
        priority: savedTask.priority,
        status: savedTask.status,
        assignedUserIds: uniqueAssigneeIds,
        createdBy: savedTask.createdBy,
        creatorName,
        correlationId,
        occurredAt: new Date().toISOString(),
        producer: 'tasks-service',
        schemaVersion: '1.0',
      };

      const taskWithAssignees = await manager.findOne(TaskEntity, {
        where: { id: savedTask.id },
        relations: ['assignees'],
      });

      return { taskWithAssignees: taskWithAssignees!, savedTaskId: savedTask.id, event };
    });

    await this.auditService.logTaskCreated(savedTaskId, createdBy);
    await this.eventPublisher.publishTaskCreated(event);

    return taskWithAssignees;
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<TaskEntity>,
    filters: TaskFilters,
  ): void {
    if (filters.priority) {
      queryBuilder.andWhere('task.priority = :priority', {
        priority: filters.priority,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('task.status = :status', {
        status: filters.status,
      });
    }

    if (filters.assigneeId) {
      queryBuilder.andWhere('assignee.userId = :assigneeId', {
        assigneeId: filters.assigneeId,
      });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }
  }

  async findAll(filters: TaskFilters): Promise<PaginatedTasks> {
    const page = filters.page ?? PAGINATION_CONFIG.DEFAULT_PAGE;
    const size = filters.size ?? PAGINATION_CONFIG.DEFAULT_PAGE_SIZE;
    const skip = (page - 1) * size;

    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignees', 'assignee');

    this.applyFilters(queryBuilder, filters);
    queryBuilder.orderBy('task.createdAt', SORT_ORDER.DESC).skip(skip).take(size);

    const [tasks, total] = await queryBuilder.getManyAndCount();

    return {
      tasks,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['assignees'],
    });

    if (!task) {
      throwRpcError(
        HttpStatus.NOT_FOUND,
        TASKS_ERRORS.TASK_NOT_FOUND,
        ErrorCode.RESOURCE_NOT_FOUND,
      );
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    if (!updateTaskDto.updatedBy) {
      throwRpcError(
        HttpStatus.BAD_REQUEST,
        'updatedBy é obrigatório',
        ErrorCode.VALIDATION_FAILED,
      );
    }

    const updatedBy = updateTaskDto.updatedBy;
    const task = await this.taskRepository.findOne({ where: { id } });

    if (!task) {
      throwRpcError(
        HttpStatus.NOT_FOUND,
        TASKS_ERRORS.TASK_NOT_FOUND,
        ErrorCode.RESOURCE_NOT_FOUND,
      );
    }

    const correlationId = updateTaskDto.correlationId ?? uuidv4();
    const changes: Record<string, unknown> = {};
    const previousStatus = task.status;

    return this.dataSource.transaction(async (manager) => {
      if (updateTaskDto.title !== undefined) {
        task.title = updateTaskDto.title.trim();
        changes.title = task.title;
      }

      if (updateTaskDto.description !== undefined) {
        task.description = updateTaskDto.description?.trim();
        changes.description = task.description;
      }

      if (updateTaskDto.deadline !== undefined) {
        task.deadline = updateTaskDto.deadline;
        changes.deadline = updateTaskDto.deadline;
      }

      if (updateTaskDto.priority !== undefined) {
        task.priority = updateTaskDto.priority;
        changes.priority = updateTaskDto.priority;
      }

      if (updateTaskDto.status !== undefined) {
        task.status = updateTaskDto.status;
        changes.status = updateTaskDto.status;
      }

      if (updateTaskDto.assignedUserIds !== undefined) {
        const newAssigneeIds = [...new Set(updateTaskDto.assignedUserIds)];

        if (newAssigneeIds.length > 0) {
          const usernameMap = await this.fetchUsernames(newAssigneeIds)
          const missing = newAssigneeIds.filter((u) => !usernameMap.has(u))
          if (missing.length > 0) {
            throwRpcError(
              HttpStatus.BAD_REQUEST,
              TASKS_ERRORS.INVALID_ASSIGNEES,
              ErrorCode.VALIDATION_FAILED,
            )
          }
          await manager.delete(TaskAssignee, { taskId: id });
          const assignees = newAssigneeIds.map((userId) =>
            manager.create(TaskAssignee, {
              taskId: id,
              userId,
              username: usernameMap.get(userId),
              assignedBy: updatedBy,
            }),
          );
          await manager.save(TaskAssignee, assignees);
        } else {
          await manager.delete(TaskAssignee, { taskId: id });
        }

        changes.assignedUserIds = newAssigneeIds;
      }

      task.updatedBy = updatedBy;

      const updatedTask = await manager.save(task);

      await this.auditService.logTaskUpdated(
        updatedTask.id,
        changes,
        updatedBy,
      );

      if (updateTaskDto.status && updateTaskDto.status !== previousStatus) {
        await this.auditService.logStatusChanged(
          updatedTask.id,
          previousStatus,
          updateTaskDto.status,
          updatedBy,
        );
      }

      const taskWithAssignees = await manager.findOne(TaskEntity, {
        where: { id: updatedTask.id },
        relations: ['assignees'],
      });

      if (!taskWithAssignees) {
        throwRpcError(
          HttpStatus.NOT_FOUND,
          TASKS_ERRORS.TASK_NOT_FOUND,
          ErrorCode.RESOURCE_NOT_FOUND,
        );
      }

      let updaterName: string | undefined
      try {
        const userResponse = await firstValueFrom(
          this.authClient.send('user.list', { ids: [updatedBy] }),
        )
        updaterName = userResponse?.users?.[0]?.username
      } catch (error) {
        this.logger.error({ error, updatedBy }, 'Falha ao buscar nome de quem atualizou')
      }

      const event: TaskUpdatedEvent = {
        id: taskWithAssignees.id,
        title: taskWithAssignees.title,
        assignedUserIds: taskWithAssignees.assignees.map((a) => a.userId),
        changes,
        updatedBy,
        updaterName,
        previousStatus,
        newStatus: taskWithAssignees.status,
        correlationId,
        occurredAt: new Date().toISOString(),
        producer: 'tasks-service',
        schemaVersion: '1.0',
      };

      await this.eventPublisher.publishTaskUpdated(event);

      return taskWithAssignees;
    });
  }

  async remove(id: string): Promise<{ success: boolean; id: string }> {
    const task = await this.taskRepository.findOne({ where: { id } });

    if (!task) {
      throwRpcError(
        HttpStatus.NOT_FOUND,
        TASKS_ERRORS.TASK_NOT_FOUND,
        ErrorCode.RESOURCE_NOT_FOUND,
      );
    }

    await this.taskRepository.remove(task);
    return { success: true, id };
  }

  async findByUser(
    userId: string,
    filters: TaskFilters,
  ): Promise<PaginatedTasks> {
    const page = filters.page ?? PAGINATION_CONFIG.DEFAULT_PAGE;
    const size = filters.size ?? PAGINATION_CONFIG.DEFAULT_PAGE_SIZE;
    const skip = (page - 1) * size;

    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignees', 'assignee');

    queryBuilder.where(
      '(task.createdBy = :userId OR assignee.userId = :userId)',
      { userId },
    );

    this.applyFilters(queryBuilder, filters);
    queryBuilder.orderBy('task.createdAt', SORT_ORDER.DESC).skip(skip).take(size);

    const [tasks, total] = await queryBuilder.getManyAndCount();

    return {
      tasks,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }
}
