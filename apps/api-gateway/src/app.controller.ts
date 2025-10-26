import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { LoginDto } from '@repo/types';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  async createUser(@Body() loginDto: LoginDto) {
    return await this.appService.createUser(loginDto);
  }
}
