import { Injectable, Inject, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  TaskCreatedEvent,
  TaskUpdatedEvent,
  CommentCreatedEvent,
} from '@repo/messaging';
import { MESSAGE_PATTERNS } from '@repo/messaging';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventPublisherService.name);

  constructor(
    @Inject('RABBITMQ_CLIENT')
    private readonly rabbitClient: ClientProxy,
  ) {}

  async onModuleInit() {
    try {
      await this.rabbitClient.connect();
      this.logger.log('RabbitMQ client connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
    }
  }

  async onModuleDestroy() {
    await this.rabbitClient.close();
    this.logger.log('RabbitMQ client disconnected');
  }

  async publishTaskCreated(event: TaskCreatedEvent): Promise<void> {
    try {
      await firstValueFrom(
        this.rabbitClient.emit(MESSAGE_PATTERNS.TASK_EVENTS.CREATED, event),
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish task.created event for task ${event.id}`,
        error,
      );
      throw error;
    }
  }

  async publishTaskUpdated(event: TaskUpdatedEvent): Promise<void> {
    try {
      await firstValueFrom(
        this.rabbitClient.emit(MESSAGE_PATTERNS.TASK_EVENTS.UPDATED, event),
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish task.updated event for task ${event.id}`,
        error,
      );
      throw error;
    }
  }

  async publishCommentCreated(event: CommentCreatedEvent): Promise<void> {
    try {
      await firstValueFrom(
        this.rabbitClient.emit(
          MESSAGE_PATTERNS.TASK_EVENTS.COMMENT_CREATED,
          event,
        ),
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish comment.created event for comment ${event.id}`,
        error,
      );
      throw error;
    }
  }
}

