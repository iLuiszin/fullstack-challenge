import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthModule } from '../auth/auth.module';

const tasksClientModule = ClientsModule.register([
  {
    name: 'TASKS',
    transport: Transport.TCP,
    options: {
      port: 3003,
      timeout: 5000,
    },
  },
]);

@Module({
  imports: [tasksClientModule, AuthModule],
  controllers: [TasksController],
  exports: [tasksClientModule],
})
export class TasksModule {}

