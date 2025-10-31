import { NestFactory } from '@nestjs/core';
import { RpcHttpExceptionFilter } from '@repo/utils';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { RABBITMQ_CONFIG } from './config/rabbitmq.config';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const DEFAULT_PORT = 3005;
const TCP_PORT = 3004;
const logger = new Logger('Bootstrap');

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
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Notifications Service')
    .setDescription('Real-time notifications and WebSocket gateway')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

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
      port: TCP_PORT,
    },
  });

  await app.startAllMicroservices();
  app.useGlobalFilters(new RpcHttpExceptionFilter());

  const port = parseInt(process.env.PORT || String(DEFAULT_PORT), 10);
  await app.listen(port);

  logger.log(`HTTP server listening on port ${port}`);
  logger.log(`TCP microservice listening on port ${TCP_PORT}`);
  logger.log(
    `Swagger documentation available at http://localhost:${port}/api/docs`,
  );
  logger.log(`RabbitMQ consumer connected to ${RABBITMQ_CONFIG.queue}`);
  logger.log(
    `WebSocket server ready on ws://localhost:${port}/notifications`,
  );
}

bootstrap();
