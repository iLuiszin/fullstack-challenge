import { NestFactory } from '@nestjs/core';
import { RpcHttpExceptionFilter } from '@repo/utils';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { DEFAULT_RADIX, TASKS_SERVICE_CONFIG } from './constants/config.constants';

async function bootstrap() {
  const port = parseInt(
    process.env.PORT ?? String(TASKS_SERVICE_CONFIG.DEFAULT_PORT),
    DEFAULT_RADIX,
  );
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: {
      port,
      host: TASKS_SERVICE_CONFIG.DEFAULT_HOST,
    },
  });

  app.useGlobalFilters(new RpcHttpExceptionFilter());
  app.listen();
}
bootstrap();
