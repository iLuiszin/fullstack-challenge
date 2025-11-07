import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { LoggerModule, createLoggerConfig } from '@repo/logger';
import { AuthModule } from './auth/auth.module';
import { getDatabaseConfig } from './config/database.config';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    LoggerModule.forRoot(createLoggerConfig('auth-service')),
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    TerminusModule,
    AuthModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
