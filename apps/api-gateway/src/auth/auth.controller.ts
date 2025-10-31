import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { JwtPayload } from '@repo/types';
import { LoginDto, RegisterDto } from '@repo/types';
import { firstValueFrom } from 'rxjs';
import { RefreshTokenAuthGuard } from './guards/refresh-token-auth.guard';
import { CurrentUser } from '@repo/decorators';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(@Inject('AUTH') private readonly authClient: ClientProxy) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() registerDto: RegisterDto) {
    return firstValueFrom(this.authClient.send('auth-register', registerDto));
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @ApiOperation({ summary: 'Login with existing credentials' })
  async login(@Body() loginDto: LoginDto) {
    return firstValueFrom(this.authClient.send('auth-login', loginDto));
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() refreshToken: string) {
    return firstValueFrom(this.authClient.send('auth-refresh', refreshToken));
  }

  @Post('sign-out')
  @UseGuards(RefreshTokenAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Sign out and invalidate refresh token' })
  async signOut(@CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.authClient.send('auth-sign-out', user.id));
  }
}
