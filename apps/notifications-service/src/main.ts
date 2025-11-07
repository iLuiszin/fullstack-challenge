import { NestFactory } from '@nestjs/core';
import { RpcHttpExceptionFilter } from '@repo/utils';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { RABBITMQ_CONFIG } from './config/rabbitmq.config';
import { ValidationPipe } from '@nestjs/common';
import { DEFAULT_RADIX, NOTIFICATIONS_SERVICE_CONFIG } from './constants/config.constants';

const tcpPort = parseInt(
  process.env.TCP_PORT ?? String(NOTIFICATIONS_SERVICE_CONFIG.DEFAULT_TCP_PORT),
  DEFAULT_RADIX,
);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? NOTIFICATIONS_SERVICE_CONFIG.DEFAULT_FRONTEND_URL,
    credentials: true,
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: RABBITMQ_CONFIG.urls,
      queue: RABBITMQ_CONFIG.queue,
      queueOptions: RABBITMQ_CONFIG.queueOptions,
      prefetchCount: RABBITMQ_CONFIG.prefetchCount,
      isGlobalPrefetchCount: RABBITMQ_CONFIG.isGlobalPrefetchCount,
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      port: tcpPort,
      host: NOTIFICATIONS_SERVICE_CONFIG.DEFAULT_HOST,
    },
  });

  await app.startAllMicroservices();
  app.useGlobalFilters(new RpcHttpExceptionFilter());

  const port = parseInt(
    process.env.PORT ?? String(NOTIFICATIONS_SERVICE_CONFIG.DEFAULT_PORT),
    DEFAULT_RADIX,
  );
  await app.listen(port);
}

bootstrap();
