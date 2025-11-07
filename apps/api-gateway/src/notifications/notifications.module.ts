import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  DEFAULT_RADIX,
  MICROSERVICE_CONFIG,
  MICROSERVICE_HOSTS,
  MICROSERVICE_PORTS,
} from '../constants/config.constants';

const notificationsClientModule = ClientsModule.register([
  {
    name: 'NOTIFICATIONS',
    transport: Transport.TCP,
    options: {
      host:
        process.env.NOTIFICATIONS_SERVICE_HOST ?? MICROSERVICE_HOSTS.NOTIFICATIONS,
      port: parseInt(
        process.env.NOTIFICATIONS_SERVICE_PORT ??
          String(MICROSERVICE_PORTS.NOTIFICATIONS),
        DEFAULT_RADIX,
      ),
      timeout: MICROSERVICE_CONFIG.TIMEOUT_MS,
    },
  },
]);

@Module({
  imports: [notificationsClientModule],
  controllers: [NotificationsController],
  exports: [notificationsClientModule],
})
export class NotificationsModule {}
