import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { RpcHttpExceptionFilter } from '@repo/utils';
import { DEFAULT_RADIX, AUTH_SERVICE_CONFIG } from './constants/config.constants';

async function bootstrap() {
  const port = parseInt(
    process.env.PORT ?? String(AUTH_SERVICE_CONFIG.DEFAULT_PORT),
    DEFAULT_RADIX,
  );
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: {
      port,
      host: AUTH_SERVICE_CONFIG.DEFAULT_HOST,
    },
  });
  app.useGlobalFilters(new RpcHttpExceptionFilter());
  app.listen();
}
bootstrap();
