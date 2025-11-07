import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PinoLogger } from 'nestjs-pino';
import { NotificationsService } from './notifications.service';
import type {
  TaskCreatedEvent,
  TaskUpdatedEvent,
  CommentCreatedEvent,
} from '@repo/messaging';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationQueryOptions } from '@repo/types';
import { FALLBACK_USER_NAME } from './constants/notifications.constants';

@Controller()
export class NotificationsController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {
    this.logger.setContext(NotificationsController.name);
  }

  @MessagePattern('task.created')
  async handleTaskCreated(@Payload() data: TaskCreatedEvent) {
    this.logger.info(`Received task.created event: ${data.id}`);

    try {
      const notifications =
        await this.notificationsService.createTaskAssignedNotifications({
          taskId: data.id,
          taskTitle: data.title,
          assigneeIds: data.assignedUserIds,
          creatorId: data.createdBy,
          creatorName: data.creatorName ?? FALLBACK_USER_NAME,
        });

      for (const notification of notifications) {
        this.notificationsGateway.emitToUser(
          notification.userId,
          'task:created',
          {
            notification,
            task: {
              id: data.id,
              title: data.title,
              priority: data.priority,
              status: data.status,
            },
          },
        );
      }

      this.logger.info(
        `Successfully processed task.created for ${notifications.length} users`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing task.created: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @MessagePattern('task.updated')
  async handleTaskUpdated(@Payload() data: TaskUpdatedEvent) {
    this.logger.info(`Received task.updated event: ${data.id}`);

    try {
      const notifications =
        await this.notificationsService.createTaskUpdatedNotifications({
          taskId: data.id,
          taskTitle: data.title,
          assigneeIds: data.assignedUserIds,
          updaterId: data.updatedBy,
          updaterName: data.updaterName ?? FALLBACK_USER_NAME,
          changes: data.changes,
        });

      for (const notification of notifications) {
        this.notificationsGateway.emitToUser(
          notification.userId,
          'task:updated',
          {
            notification,
            task: {
              id: data.id,
              title: data.title,
              changes: data.changes,
            },
          },
        );
      }

      this.logger.info(
        `Successfully processed task.updated for ${notifications.length} users`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing task.updated: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @MessagePattern('comment.created')
  async handleCommentCreated(@Payload() data: CommentCreatedEvent) {
    this.logger.info(`Received comment.created event for task: ${data.taskId}`);

    try {
      const notifications =
        await this.notificationsService.createCommentAddedNotification({
          taskId: data.taskId,
          taskTitle: data.taskTitle,
          commentId: data.id,
          commentContent: data.content,
          assigneeIds: data.taskAssigneeIds,
          authorId: data.authorId,
          authorName: data.authorName ?? FALLBACK_USER_NAME,
        });

      for (const notification of notifications) {
        this.notificationsGateway.emitToUser(
          notification.userId,
          'comment:new',
          {
            notification,
            comment: {
              id: data.id,
              taskId: data.taskId,
              content: data.content,
              authorName: data.authorName,
            },
          },
        );
      }

      this.logger.info(
        `Successfully processed comment.created for ${notifications.length} users`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing comment.created: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @MessagePattern('notifications.findByUser')
  async findNotificationsByUser(
    @Payload() data: { userId: string; options?: NotificationQueryOptions },
  ) {
    return this.notificationsService.getUserNotifications(
      data.userId,
      data.options,
    );
  }

  @MessagePattern('notifications.markAsRead')
  async markNotificationsAsRead(
    @Payload() data: { notificationId: string; userId: string },
  ) {
    return this.notificationsService.markAsRead(
      data.notificationId,
      data.userId,
    );
  }

  @MessagePattern('notifications.markAllAsRead')
  async markAllNotificationsAsRead(@Payload() data: { userId: string }) {
    await this.notificationsService.markAllAsRead(data.userId);

    return { success: true };
  }

  @MessagePattern('notifications.delete')
  async deleteNotification(
    @Payload() data: { notificationId: string; userId: string },
  ) {
    await this.notificationsService.deleteNotification(
      data.notificationId,
      data.userId,
    );

    return { success: true };
  }

  @MessagePattern('notifications.deleteAll')
  async deleteAllNotifications(@Payload() data: { userId: string }) {
    await this.notificationsService.deleteAllNotifications(data.userId);

    return { success: true };
  }
}
