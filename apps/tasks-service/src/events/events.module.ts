import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EventPublisherService } from './event-publisher.service';
import { RABBITMQ_CONFIG } from '../config/rabbitmq.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RABBITMQ_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: RABBITMQ_CONFIG.urls,
          queue: RABBITMQ_CONFIG.queue,
          queueOptions: RABBITMQ_CONFIG.queueOptions,
          prefetchCount: RABBITMQ_CONFIG.prefetchCount,
          isGlobalPrefetchCount: RABBITMQ_CONFIG.isGlobalPrefetchCount,
        },
      },
    ]),
  ],
  providers: [EventPublisherService],
  exports: [EventPublisherService],
})
export class EventsModule {}

