import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { Task } from '../entities/task.entity';
import { CreateCommentDto, PaginatedComments, ErrorCode } from '@repo/types';
import { EventPublisherService } from '../events/event-publisher.service';
import { CommentCreatedEvent } from '@repo/messaging';
import { throwRpcError } from '@repo/utils';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly eventPublisher: EventPublisherService,
    private readonly dataSource: DataSource,
  ) {}

  async createComment(dto: CreateCommentDto): Promise<Comment> {
    if (!dto.taskId || !dto.authorId) {
      throwRpcError(
        HttpStatus.BAD_REQUEST,
        'taskId and authorId are required',
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
        'Task not found',
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

      const event: CommentCreatedEvent = {
        id: savedComment.id,
        taskId: savedComment.taskId,
        taskTitle: task.title,
        content: savedComment.content,
        authorId: savedComment.authorId,
        taskAssigneeIds: task.assignees?.map((a) => a.userId) || [],
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
    page = 1,
    size = 10,
  ): Promise<PaginatedComments> {
    const skip = (page - 1) * size;

    const [comments, total] = await this.commentRepository.findAndCount({
      where: { taskId },
      order: { createdAt: 'DESC' },
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

