import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Comment } from '../entities/comment.entity';
import { Task } from '../entities/task.entity';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { EventsModule } from '../events/events.module';
import { DEFAULT_RADIX, AUTH_SERVICE_CONFIG } from '../constants/config.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, Task]),
    ClientsModule.register([
      {
        name: 'AUTH',
        transport: Transport.TCP,
        options: {
          host: process.env.AUTH_SERVICE_HOST ?? AUTH_SERVICE_CONFIG.DEFAULT_HOST,
          port: parseInt(
            process.env.AUTH_SERVICE_PORT ?? String(AUTH_SERVICE_CONFIG.DEFAULT_PORT),
            DEFAULT_RADIX,
          ),
          timeout: AUTH_SERVICE_CONFIG.DEFAULT_TIMEOUT_MS,
        },
      },
    ]),
    EventsModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
