import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  LoginDto,
  JwtPayload,
  LoginResponse,
  ValidateTokenResponse,
} from '@repo/types';

@Injectable()
export class AppService {
  constructor(private jwtService: JwtService) {}

  login(credentials: LoginDto): LoginResponse {
    if (
      credentials.email === 'admin@teste.com' &&
      credentials.password === 'password'
    ) {
      const payload: JwtPayload = {
        id: '123',
        email: credentials.email,
        role: 'admin',
      };
      const accessToken = this.jwtService.sign(payload);
      return { accessToken };
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  validateToken(accessToken: string): ValidateTokenResponse {
    try {
      const decoded = this.jwtService.verify<JwtPayload>(accessToken);
      return { valid: true, userId: decoded.id, role: decoded.role };
    } catch (_error) {
      return { valid: false, userId: null, role: null };
    }
  }
}
