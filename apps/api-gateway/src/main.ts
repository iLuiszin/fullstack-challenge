import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { RpcErrorInterceptor } from './interceptors/rpc-error.interceptor';
import { API_CONFIG } from './constants/config.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? API_CONFIG.DEFAULT_CORS_ORIGIN,
    credentials: true,
  });

  app.setGlobalPrefix(API_CONFIG.PREFIX);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalInterceptors(new RpcErrorInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('API Gateway')
    .setDescription('Microservices API Gateway - Authentication, Users, Tasks')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${API_CONFIG.PREFIX}/docs`, app, document);

  await app.listen(process.env.PORT ?? API_CONFIG.DEFAULT_PORT);
}
bootstrap();
