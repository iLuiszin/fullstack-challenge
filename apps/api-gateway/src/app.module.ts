import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TerminusModule } from '@nestjs/terminus';
import { LoggerModule, createLoggerConfig } from '@repo/logger';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TasksModule } from './tasks/tasks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { HealthController } from './health/health.controller';
import { UserThrottlerGuard } from './guards/user-throttler.guard';
import { THROTTLE_CONFIG } from './constants/config.constants';

@Module({
  imports: [
    LoggerModule.forRoot(createLoggerConfig('api-gateway')),
    ThrottlerModule.forRoot([
      {
        ttl: THROTTLE_CONFIG.TTL_MS,
        limit: THROTTLE_CONFIG.REQUEST_LIMIT,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TerminusModule,
    AuthModule,
    UserModule,
    TasksModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: UserThrottlerGuard,
    },
  ],
})
export class AppModule {}
