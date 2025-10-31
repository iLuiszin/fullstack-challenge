import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  LoginDto,
  JwtPayload,
  AuthResponse,
  RegisterDto,
  UserResponse,
  ErrorCode,
} from '@repo/types';
import { throwRpcError } from '@repo/utils';
import { UserService } from '../user/user.service';
import { hash, verify } from 'argon2';
import { AUTH_ERRORS } from './constants/auth.constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject('REFRESH_JWT_SERVICE')
    private readonly refreshJwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async register(credentials: RegisterDto): Promise<AuthResponse> {
    const userExists = await this.userService.findByEmail(credentials.email);

    if (userExists) {
      throwRpcError(
        HttpStatus.CONFLICT,
        AUTH_ERRORS.USER_ALREADY_EXISTS,
        ErrorCode.USER_ALREADY_EXISTS,
      );
    }

    const hashedPassword = await hash(credentials.password);

    const newUser = await this.userService.create({
      ...credentials,
      password: hashedPassword,
    });

    return this.generateAndStoreTokens(newUser);
  }

  async login(credentials: LoginDto): Promise<AuthResponse> {
    const user = await this.userService.findByEmail(credentials.email);

    if (!user) {
      throwRpcError(
        HttpStatus.UNAUTHORIZED,
        AUTH_ERRORS.INVALID_CREDENTIALS,
        ErrorCode.INVALID_CREDENTIALS,
      );
    }

    const passwordMatch = await verify(user.password, credentials.password);

    if (!passwordMatch) {
      throwRpcError(
        HttpStatus.UNAUTHORIZED,
        AUTH_ERRORS.INVALID_CREDENTIALS,
        ErrorCode.INVALID_CREDENTIALS,
      );
    }

    return this.generateAndStoreTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const payload = await this.refreshJwtService.verifyAsync(refreshToken);

    const user = await this.userService.findById(payload.id);

    if (!user || !user.hashedRefreshToken) {
      throwRpcError(
        HttpStatus.UNAUTHORIZED,
        AUTH_ERRORS.INVALID_REFRESH_TOKEN,
        ErrorCode.INVALID_REFRESH_TOKEN,
      );
    }

    const isValidToken = await verify(user.hashedRefreshToken, refreshToken);

    if (!isValidToken) {
      throwRpcError(
        HttpStatus.UNAUTHORIZED,
        AUTH_ERRORS.INVALID_REFRESH_TOKEN,
        ErrorCode.INVALID_REFRESH_TOKEN,
      );
    }

    return this.generateAndStoreTokens(user);
  }

  async signOut(userId: string): Promise<void> {
    await this.userService.updateHashedRefreshToken(userId, null);
  }

  private async generateAndStoreTokens(
    user: UserResponse,
  ): Promise<AuthResponse> {
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.refreshJwtService.signAsync(payload),
    ]);

    const hashedRefreshToken = await hash(refreshToken);
    await this.userService.updateHashedRefreshToken(
      user.id,
      hashedRefreshToken,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
