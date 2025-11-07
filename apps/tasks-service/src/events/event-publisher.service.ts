import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PinoLogger } from 'nestjs-pino';
import {
  TaskCreatedEvent,
  TaskUpdatedEvent,
  CommentCreatedEvent,
} from '@repo/messaging';
import { MESSAGE_PATTERNS } from '@repo/messaging';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject('RABBITMQ_CLIENT')
    private readonly rabbitClient: ClientProxy,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EventPublisherService.name);
  }

  async onModuleInit() {
    try {
      await this.rabbitClient.connect();
      this.logger.info('RabbitMQ client connected successfully');
    } catch (error) {
      this.logger.error({ error }, 'Failed to connect to RabbitMQ');
    }
  }

  async onModuleDestroy() {
    await this.rabbitClient.close();
    this.logger.info('RabbitMQ client disconnected');
  }

  async publishTaskCreated(event: TaskCreatedEvent): Promise<void> {
    try {
      await firstValueFrom(
        this.rabbitClient.emit(MESSAGE_PATTERNS.TASK_EVENTS.CREATED, event),
      );
    } catch (error) {
      this.logger.error(
        { error, taskId: event.id },
        'Failed to publish task.created event',
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
        { error, taskId: event.id },
        'Failed to publish task.updated event',
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
        { error, commentId: event.id },
        'Failed to publish comment.created event',
      );
      throw error;
    }
  }
}

