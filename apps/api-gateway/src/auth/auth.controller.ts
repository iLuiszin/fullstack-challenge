import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { LoginDto, RegisterDto } from '@repo/types';
import { firstValueFrom } from 'rxjs';

@Controller('auth')
export class AuthController {
  constructor(@Inject('AUTH') private readonly authClient: ClientProxy) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return firstValueFrom(this.authClient.send('auth-register', registerDto));
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return firstValueFrom(this.authClient.send('auth-login', loginDto));
  }
}
