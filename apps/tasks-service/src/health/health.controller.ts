import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { RABBITMQ_CONFIG } from '../constants/config.constants';

@Controller('health')
export class HealthController {
  constructor(
    private healthCheckService: HealthCheckService,
    private databaseHealthIndicator: TypeOrmHealthIndicator,
    private microserviceHealthIndicator: MicroserviceHealthIndicator,
    private configService: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  checkHealth() {
    const rabbitmqUri =
      this.configService.get<string>('RABBITMQ_URI') ??
      RABBITMQ_CONFIG.DEFAULT_URI;

    return this.healthCheckService.check([
      () => this.databaseHealthIndicator.pingCheck('database'),
      () =>
        this.microserviceHealthIndicator.pingCheck('rabbitmq', {
          transport: Transport.RMQ,
          options: {
            urls: [rabbitmqUri],
          },
        }),
    ]);
  }
}
