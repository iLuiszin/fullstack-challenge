import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private healthCheckService: HealthCheckService,
    private databaseHealthIndicator: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  checkHealth() {
    return this.healthCheckService.check([
      () => this.databaseHealthIndicator.pingCheck('database'),
    ]);
  }
}
