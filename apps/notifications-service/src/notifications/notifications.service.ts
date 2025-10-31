import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async createTaskAssignedNotifications(
    input: TaskAssignedInput,
  ): Promise<Notification[]> {
    const notifications = input.assigneeIds.map((assigneeId) =>
      this.notificationRepository.create({
        userId: assigneeId,
        type: NotificationType.TASK_ASSIGNED,
        message: `${input.creatorName} assigned you to task ${input.taskTitle}`,
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

    if (recipientIds.length === 0) {
      return [];
    }

    const changeDescription = this.formatChanges(input.changes);

    const notifications = recipientIds.map((userId) =>
      this.notificationRepository.create({
        userId,
        type: NotificationType.TASK_UPDATED,
        message: `${input.updaterName} updated "${input.taskTitle}": ${changeDescription}`,
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

    if (recipientIds.length === 0) {
      return [];
    }

    const truncatedContent =
      input.commentContent.length > TRUNCATE_COMMENT_AT
        ? `${input.commentContent.substring(0, TRUNCATE_COMMENT_AT)}...`
        : input.commentContent;

    const notifications = recipientIds.map((userId) =>
      this.notificationRepository.create({
        userId,
        type: NotificationType.COMMENT_ADDED,
        message: `${input.authorName} commented on "${input.taskTitle}": ${truncatedContent}`,
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
    const page = options.page || DEFAULT_PAGE;
    const size = options.size || DEFAULT_PAGE_SIZE;
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

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const result = await this.notificationRepository.update(
      { id: notificationId, userId },
      { isRead: true },
    );

    if (result.affected === 0) {
      this.logger.error(
        `Notification not found or unauthorized: notificationId=${notificationId}, userId=${userId}`,
      );
      throw new NotFoundException(ErrorCode.NOTIFICATION_NOT_FOUND);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  private formatChanges(changes: TaskUpdatedInput['changes']): string {
    if (changes.status) {
      return `Status changed to ${changes.status}`;
    }

    if (changes.priority) {
      return `Priority changed to ${changes.priority}`;
    }

    if (changes.assignedUserIds) {
      return 'Assignees updated';
    }

    if (changes.title) {
      return 'Title updated';
    }

    if (changes.description) {
      return 'Description updated';
    }

    if (changes.deadline) {
      return 'Deadline updated';
    }

    return 'Task updated';
  }
}
