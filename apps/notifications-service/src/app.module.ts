import { Module } from '@nestjs/common';
import { NotificationsModule } from './notifications/notifications.module';
import databaseConfig from './config/database.config';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: databaseConfig,
    }),
    NotificationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
