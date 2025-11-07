import { Injectable, HttpStatus, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { PinoLogger } from 'nestjs-pino';
import { Comment } from '../entities/comment.entity';
import { Task } from '../entities/task.entity';
import { PaginatedComments, ErrorCode } from '@repo/types';
import { CreateCommentDto } from '@repo/dto';
import { EventPublisherService } from '../events/event-publisher.service';
import { CommentCreatedEvent } from '@repo/messaging';
import { throwRpcError } from '@repo/utils';
import { TASKS_ERRORS } from '../tasks/constants/tasks.constants';
import { PAGINATION_CONFIG, SORT_ORDER } from '../constants/config.constants';
import { v4 as uuidv4 } from 'uuid';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly eventPublisher: EventPublisherService,
    private readonly dataSource: DataSource,
    @Inject('AUTH') private readonly authClient: ClientProxy,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommentsService.name);
  }

  async createComment(dto: CreateCommentDto): Promise<Comment> {
    if (!dto.taskId || !dto.authorId) {
      throwRpcError(
        HttpStatus.BAD_REQUEST,
        TASKS_ERRORS.COMMENT_FIELDS_REQUIRED,
        ErrorCode.VALIDATION_FAILED,
      );
    }

    const taskId = dto.taskId;
    const authorId = dto.authorId;

    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['assignees'],
    });

    if (!task) {
      throwRpcError(
        HttpStatus.NOT_FOUND,
        TASKS_ERRORS.TASK_NOT_FOUND,
        ErrorCode.RESOURCE_NOT_FOUND,
      );
    }

    const correlationId = dto.correlationId || uuidv4();

    return this.dataSource.transaction(async (manager) => {
      const comment = manager.create(Comment, {
        content: dto.content.trim(),
        taskId,
        authorId,
      });

      const savedComment = await manager.save(comment);

      let authorName: string | undefined;
      try {
        const userResponse = await firstValueFrom(
          this.authClient.send('user.list', { ids: [authorId] }),
        );
        authorName = userResponse?.users?.[0]?.username;
      } catch (error) {
        this.logger.error(
          { error, authorId },
          'Falha ao buscar nome do autor',
        );
      }

      const event: CommentCreatedEvent = {
        id: savedComment.id,
        taskId: savedComment.taskId,
        taskTitle: task.title,
        content: savedComment.content,
        authorId: savedComment.authorId,
        authorName,
        taskAssigneeIds: task.assignees?.map((a) => a.userId) ?? [],
        correlationId,
        occurredAt: new Date().toISOString(),
        producer: 'tasks-service',
        schemaVersion: '1.0',
      };

      await this.eventPublisher.publishCommentCreated(event);

      return savedComment;
    });
  }

  async findByTaskId(
    taskId: string,
    page: number = PAGINATION_CONFIG.DEFAULT_PAGE,
    size: number = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedComments> {
    const skip = (page - 1) * size;

    const [comments, total] = await this.commentRepository.findAndCount({
      where: { taskId },
      order: { createdAt: SORT_ORDER.DESC },
      skip,
      take: size,
    });

    return {
      comments,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }
}
