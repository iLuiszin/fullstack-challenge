import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import { Transport } from '@nestjs/microservices';
import { DEFAULT_RADIX, MICROSERVICE_HOSTS, MICROSERVICE_PORTS } from '../constants/config.constants';

@Controller('health')
export class HealthController {
  constructor(
    private healthCheckService: HealthCheckService,
    private microserviceHealthIndicator: MicroserviceHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  checkHealth() {
    return this.healthCheckService.check([
      () =>
        this.microserviceHealthIndicator.pingCheck('auth-service', {
          transport: Transport.TCP,
          options: {
            host: MICROSERVICE_HOSTS.AUTH,
            port: parseInt(
              process.env.AUTH_SERVICE_PORT || String(MICROSERVICE_PORTS.AUTH),
              DEFAULT_RADIX,
            ),
          },
        }),
      () =>
        this.microserviceHealthIndicator.pingCheck('tasks-service', {
          transport: Transport.TCP,
          options: {
            host: MICROSERVICE_HOSTS.TASKS,
            port: parseInt(
              process.env.TASKS_SERVICE_PORT || String(MICROSERVICE_PORTS.TASKS),
              DEFAULT_RADIX,
            ),
          },
        }),
    ]);
  }
}
