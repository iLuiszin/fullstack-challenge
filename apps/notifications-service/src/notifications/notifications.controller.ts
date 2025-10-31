import { Controller, Logger } from '@nestjs/common';
import {
  MessagePattern,
  Payload,
  Ctx,
  RmqContext,
} from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';
import type {
  TaskCreatedEvent,
  TaskUpdatedEvent,
  CommentCreatedEvent,
} from '@repo/messaging';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationQueryOptions } from '@repo/types';

@Controller()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  @MessagePattern('task.created')
  async handleTaskCreated(
    @Payload() data: TaskCreatedEvent,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`Received task.created event: ${data.id}`);

    try {
      const notifications =
        await this.notificationsService.createTaskAssignedNotifications({
          taskId: data.id,
          taskTitle: data.title,
          assigneeIds: data.assignedUserIds,
          creatorId: data.createdBy,
          creatorName: data.creatorName || 'Usuário Desconhecido',
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

      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);

      this.logger.log(
        `Successfully processed task.created for ${notifications.length} users`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing task.created: ${error.message}`,
        error.stack,
      );

      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.nack(originalMsg, false, true);
    }
  }

  @MessagePattern('task.updated')
  async handleTaskUpdated(
    @Payload() data: TaskUpdatedEvent,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`Received task.updated event: ${data.id}`);

    try {
      const notifications =
        await this.notificationsService.createTaskUpdatedNotifications({
          taskId: data.id,
          taskTitle: data.title,
          assigneeIds: data.assignedUserIds,
          updaterId: data.updatedBy,
          updaterName: data.updaterName || 'Usuário Desconhecido',
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

      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);

      this.logger.log(
        `Successfully processed task.updated for ${notifications.length} users`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing task.updated: ${error.message}`,
        error.stack,
      );

      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.nack(originalMsg, false, true);
    }
  }

  @MessagePattern('comment.created')
  async handleCommentCreated(
    @Payload() data: CommentCreatedEvent,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`Received comment.created event for task: ${data.taskId}`);

    try {
      const notifications =
        await this.notificationsService.createCommentAddedNotification({
          taskId: data.taskId,
          taskTitle: data.taskTitle,
          commentId: data.id,
          commentContent: data.content,
          assigneeIds: data.taskAssigneeIds,
          authorId: data.authorId,
          authorName: data.authorName || 'Usuário Desconhecido',
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

      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);

      this.logger.log(
        `Successfully processed comment.created for ${notifications.length} users`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing comment.created: ${error.message}`,
        error.stack,
      );

      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.nack(originalMsg, false, true);
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
}
