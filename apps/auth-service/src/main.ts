import { ApplicationConfig, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { RpcHttpExceptionFilter } from '@repo/utils';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        port: 3002,
      },
    },
  );
  app.useGlobalFilters(new RpcHttpExceptionFilter());
  app.listen();
}
bootstrap();
