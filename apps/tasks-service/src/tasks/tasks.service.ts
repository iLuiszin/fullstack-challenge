import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilters,
  Task,
  PaginatedTasks,
  Status,
  ErrorCode,
} from '@repo/types';
import { Task as TaskEntity } from '../entities/task.entity';
import { TaskAssignee } from '../entities/task-assignee.entity';
import { EventPublisherService } from '../events/event-publisher.service';
import { AuditService } from '../audit/audit.service';
import { TaskCreatedEvent, TaskUpdatedEvent } from '@repo/messaging';
import { throwRpcError } from '@repo/utils';
import { v4 as uuidv4 } from 'uuid';

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
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    if (!createTaskDto.createdBy) {
      throwRpcError(
        HttpStatus.BAD_REQUEST,
        'createdBy is required',
        ErrorCode.VALIDATION_FAILED,
      );
    }

    const createdBy = createTaskDto.createdBy;
    const correlationId = createTaskDto.correlationId || uuidv4();
    const assignedUserIds = createTaskDto.assignedUserIds || [];
    const uniqueAssigneeIds = [...new Set(assignedUserIds)];

    return this.dataSource.transaction(async (manager) => {
      const task = manager.create(TaskEntity, {
        title: createTaskDto.title.trim(),
        description: createTaskDto.description?.trim(),
        deadline: createTaskDto.deadline,
        priority: createTaskDto.priority,
        status: createTaskDto.status || Status.TODO,
        createdBy,
      });

      const savedTask = await manager.save(task);

      if (uniqueAssigneeIds.length > 0) {
        const assignees = uniqueAssigneeIds.map((userId) =>
          manager.create(TaskAssignee, {
            taskId: savedTask.id,
            userId,
            assignedBy: createdBy,
          }),
        );
        await manager.save(TaskAssignee, assignees);
      }

      await this.auditService.logTaskCreated(savedTask.id, createdBy);

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
        correlationId,
        occurredAt: new Date().toISOString(),
        producer: 'tasks-service',
        schemaVersion: '1.0',
      };

      await this.eventPublisher.publishTaskCreated(event);

      // Query within the same transaction to get the task with assignees
      const taskWithAssignees = await manager.findOne(TaskEntity, {
        where: { id: savedTask.id },
        relations: ['assignees'],
      });

      return taskWithAssignees!;
    });
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
    const page = filters.page || 1;
    const size = filters.size || 10;
    const skip = (page - 1) * size;

    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignees', 'assignee');

    this.applyFilters(queryBuilder, filters);
    queryBuilder.orderBy('task.createdAt', 'DESC').skip(skip).take(size);

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
        `Task with ID ${id} not found`,
        ErrorCode.RESOURCE_NOT_FOUND,
      );
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    if (!updateTaskDto.updatedBy) {
      throwRpcError(
        HttpStatus.BAD_REQUEST,
        'updatedBy is required',
        ErrorCode.VALIDATION_FAILED,
      );
    }

    const updatedBy = updateTaskDto.updatedBy;
    const task = await this.taskRepository.findOne({ where: { id } });

    if (!task) {
      throwRpcError(
        HttpStatus.NOT_FOUND,
        'Task not found',
        ErrorCode.RESOURCE_NOT_FOUND,
      );
    }

    const correlationId = updateTaskDto.correlationId || uuidv4();
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

        await manager.delete(TaskAssignee, { taskId: id });

        if (newAssigneeIds.length > 0) {
          const assignees = newAssigneeIds.map((userId) =>
            manager.create(TaskAssignee, {
              taskId: id,
              userId,
              assignedBy: updatedBy,
            }),
          );
          await manager.save(TaskAssignee, assignees);
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

      const event: TaskUpdatedEvent = {
        id: updatedTask.id,
        title: updatedTask.title,
        assignedUserIds: updatedTask.assignees.map((a) => a.userId),
        changes,
        updatedBy,
        previousStatus,
        newStatus: updatedTask.status,
        correlationId,
        occurredAt: new Date().toISOString(),
        producer: 'tasks-service',
        schemaVersion: '1.0',
      };

      await this.eventPublisher.publishTaskUpdated(event);

      return this.findOne(updatedTask.id);
    });
  }

  async remove(id: string): Promise<void> {
    const task = await this.taskRepository.findOne({ where: { id } });

    if (!task) {
      throwRpcError(
        HttpStatus.NOT_FOUND,
        'Task not found',
        ErrorCode.RESOURCE_NOT_FOUND,
      );
    }

    await this.taskRepository.remove(task);
  }

  async findByUser(
    userId: string,
    filters: TaskFilters,
  ): Promise<PaginatedTasks> {
    const page = filters.page || 1;
    const size = filters.size || 10;
    const skip = (page - 1) * size;

    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignees', 'assignee');

    queryBuilder.where(
      '(task.createdBy = :userId OR assignee.userId = :userId)',
      { userId },
    );

    this.applyFilters(queryBuilder, filters);
    queryBuilder.orderBy('task.createdAt', 'DESC').skip(skip).take(size);

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
