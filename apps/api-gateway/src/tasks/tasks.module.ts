import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthModule } from '../auth/auth.module';
import {
  DEFAULT_RADIX,
  MICROSERVICE_CONFIG,
  MICROSERVICE_HOSTS,
  MICROSERVICE_PORTS,
} from '../constants/config.constants';

const tasksClientModule = ClientsModule.register([
  {
    name: 'TASKS',
    transport: Transport.TCP,
    options: {
      host: process.env.TASKS_SERVICE_HOST ?? MICROSERVICE_HOSTS.TASKS,
      port: parseInt(
        process.env.TASKS_SERVICE_PORT ?? String(MICROSERVICE_PORTS.TASKS),
        DEFAULT_RADIX,
      ),
      timeout: MICROSERVICE_CONFIG.TIMEOUT_MS,
    },
  },
]);

@Module({
  imports: [tasksClientModule, AuthModule],
  controllers: [TasksController],
  exports: [tasksClientModule],
})
export class TasksModule {}
