import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { Task } from '../entities/task.entity'
import { TaskAssignee } from '../entities/task-assignee.entity'
import { TasksController } from './tasks.controller'
import { TasksService } from './tasks.service'
import { EventsModule } from '../events/events.module'
import { AuditModule } from '../audit/audit.module'
import { DEFAULT_RADIX, AUTH_SERVICE_CONFIG } from '../constants/config.constants'

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskAssignee]),
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
    AuditModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
