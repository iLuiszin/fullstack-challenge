import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import type { JwtPayload } from '@repo/types'
import { LoginDto, RegisterDto } from '@repo/dto'
import { firstValueFrom } from 'rxjs';
import { RefreshTokenAuthGuard } from './guards/refresh-token-auth.guard';
import { CurrentUser } from '@repo/decorators';
import { Throttle } from '@nestjs/throttler';
import { AUTH_THROTTLE_CONFIG } from '../constants/config.constants';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(@Inject('AUTH') private readonly authClient: ClientProxy) {}

  @Throttle({ default: { limit: AUTH_THROTTLE_CONFIG.REGISTER_LIMIT, ttl: AUTH_THROTTLE_CONFIG.TTL_MS } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() registerDto: RegisterDto) {
    return firstValueFrom(this.authClient.send('auth-register', registerDto));
  }

  @Throttle({ default: { limit: AUTH_THROTTLE_CONFIG.LOGIN_LIMIT, ttl: AUTH_THROTTLE_CONFIG.TTL_MS } })
  @Post('login')
  @ApiOperation({ summary: 'Login with existing credentials' })
  async login(@Body() loginDto: LoginDto) {
    return firstValueFrom(this.authClient.send('auth-login', loginDto));
  }

  @Throttle({ default: { limit: AUTH_THROTTLE_CONFIG.REFRESH_LIMIT, ttl: AUTH_THROTTLE_CONFIG.TTL_MS } })
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
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
