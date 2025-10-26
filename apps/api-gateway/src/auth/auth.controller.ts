import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { LoginDto } from '@repo/types';
import { firstValueFrom } from 'rxjs';

@Controller('auth')
export class AuthController {
  constructor(@Inject('AUTH') private readonly authClient: ClientProxy) {}

  @Post('login')
  async login(@Body() credentials: LoginDto) {
    return firstValueFrom(this.authClient.send('auth-login', credentials));
  }
}
