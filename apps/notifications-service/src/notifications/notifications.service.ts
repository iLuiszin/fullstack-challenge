import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PinoLogger } from 'nestjs-pino';
import { Notification } from '../entities/notification.entity';
import {
  NotificationType,
  TaskAssignedInput,
  TaskUpdatedInput,
  CommentAddedInput,
  NotificationQueryOptions,
  PaginatedNotifications,
  TRUNCATE_COMMENT_AT,
  ErrorCode,
} from '@repo/types';
import { throwRpcError } from '@repo/utils';
import { NOTIFICATIONS_ERRORS } from './constants/notifications.constants';
import { PAGINATION_CONFIG } from '../constants/config.constants';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly logger: PinoLogger,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {
    this.logger.setContext(NotificationsService.name);
  }

  async createTaskAssignedNotifications(
    input: TaskAssignedInput,
  ): Promise<Notification[]> {
    const recipientIds = input.assigneeIds.filter(
      (id) => id !== input.creatorId,
    );

    if (recipientIds.length === 0) return [];

    const notifications = recipientIds.map((assigneeId) =>
      this.notificationRepository.create({
        userId: assigneeId,
        type: NotificationType.TASK_ASSIGNED,
        message: `${input.creatorName} atribuiu você à tarefa ${input.taskTitle}`,
        metadata: {
          taskId: input.taskId,
          taskTitle: input.taskTitle,
          actorId: input.creatorId,
          actorName: input.creatorName,
        },
      }),
    );

    return this.notificationRepository.save(notifications);
  }

  async createTaskUpdatedNotifications(
    input: TaskUpdatedInput,
  ): Promise<Notification[]> {
    const recipientIds = input.assigneeIds.filter(
      (id) => id !== input.updaterId,
    );

    if (recipientIds.length === 0) return [];

    const changeDescription = this.formatChanges(input.changes);

    const notifications = recipientIds.map((userId) =>
      this.notificationRepository.create({
        userId,
        type: NotificationType.TASK_UPDATED,
        message: `${input.updaterName} atualizou "${input.taskTitle}": ${changeDescription}`,
        metadata: {
          taskId: input.taskId,
          taskTitle: input.taskTitle,
          actorId: input.updaterId,
          actorName: input.updaterName,
          changes: input.changes,
        },
      }),
    );

    return this.notificationRepository.save(notifications);
  }

  async createCommentAddedNotification(
    input: CommentAddedInput,
  ): Promise<Notification[]> {
    const recipientIds = input.assigneeIds.filter(
      (id) => id !== input.authorId,
    );

    if (recipientIds.length === 0) return [];

    const truncatedContent =
      input.commentContent.length > TRUNCATE_COMMENT_AT
        ? `${input.commentContent.substring(0, TRUNCATE_COMMENT_AT)}...`
        : input.commentContent;

    const notifications = recipientIds.map((userId) =>
      this.notificationRepository.create({
        userId,
        type: NotificationType.COMMENT_ADDED,
        message: `${input.authorName} comentou em "${input.taskTitle}": ${truncatedContent}`,
        metadata: {
          taskId: input.taskId,
          taskTitle: input.taskTitle,
          commentId: input.commentId,
          actorId: input.authorId,
          actorName: input.authorName,
        },
      }),
    );

    return this.notificationRepository.save(notifications);
  }

  async getUserNotifications(
    userId: string,
    options: NotificationQueryOptions = {},
  ): Promise<PaginatedNotifications> {
    const page = options.page ?? PAGINATION_CONFIG.DEFAULT_PAGE;
    const size = options.size ?? PAGINATION_CONFIG.DEFAULT_PAGE_SIZE;
    const skip = (page - 1) * size;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .take(size)
      .skip(skip);

    if (options.unreadOnly) {
      queryBuilder.andWhere('notification.isRead = :isRead', {
        isRead: false,
      });
    }

    const [notifications, total] = await queryBuilder.getManyAndCount();

    return {
      data: notifications,
      pagination: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size),
      },
    };
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const result = await this.notificationRepository.update(
      { id: notificationId, userId },
      { isRead: true },
    );

    if (result.affected === 0) {
      this.logger.error(
        `Notificação não encontrada ou não autorizada: notificationId=${notificationId}, userId=${userId}`,
      );
      throwRpcError(
        HttpStatus.NOT_FOUND,
        NOTIFICATIONS_ERRORS.NOTIFICATION_NOT_FOUND,
        ErrorCode.NOTIFICATION_NOT_FOUND,
      );
    }

    const updatedNotification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!updatedNotification) {
      this.logger.error(
        `Notificação não encontrada após atualização: notificationId=${notificationId}, userId=${userId}`,
      );
      throwRpcError(
        HttpStatus.NOT_FOUND,
        NOTIFICATIONS_ERRORS.NOTIFICATION_NOT_FOUND,
        ErrorCode.NOTIFICATION_NOT_FOUND,
      );
    }

    return updatedNotification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const result = await this.notificationRepository.delete({
      id: notificationId,
      userId,
    });

    if (result.affected === 0) {
      this.logger.error(
        `Notificação não encontrada ou não autorizada: notificationId=${notificationId}, userId=${userId}`,
      );
      throwRpcError(
        HttpStatus.NOT_FOUND,
        NOTIFICATIONS_ERRORS.NOTIFICATION_NOT_FOUND,
        ErrorCode.NOTIFICATION_NOT_FOUND,
      );
    }
  }

  async deleteAllNotifications(userId: string): Promise<void> {
    await this.notificationRepository.delete({
      userId,
    });
  }

  private formatChanges(changes: TaskUpdatedInput['changes']): string {
    if (changes.status) return `Status alterado para ${changes.status}`;
    if (changes.priority) return `Prioridade alterada para ${changes.priority}`;
    if (changes.assignedUserIds) return 'Responsáveis atualizados';
    if (changes.title) return 'Título atualizado';
    if (changes.description) return 'Descrição atualizada';
    if (changes.deadline) return 'Prazo atualizado';
    return 'Tarefa atualizada';
  }
}

