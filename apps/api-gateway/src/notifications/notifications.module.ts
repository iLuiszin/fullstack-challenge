import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

const notificationsClientModule = ClientsModule.register([
  {
    name: 'NOTIFICATIONS',
    transport: Transport.TCP,
    options: {
      port: 3004,
      timeout: 5000,
    },
  },
]);

@Module({
  imports: [notificationsClientModule],
  controllers: [NotificationsController],
  exports: [notificationsClientModule],
})
export class NotificationsModule {}
