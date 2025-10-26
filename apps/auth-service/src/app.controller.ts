import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoginDto } from '@repo/types';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('auth-login')
  async login(@Payload() credentials: LoginDto) {
    return this.appService.login(credentials);
  }

  @MessagePattern('validate-token')
  async validateToken(@Payload() accessToken: string) {
    return this.appService.validateToken(accessToken);
  }
}
