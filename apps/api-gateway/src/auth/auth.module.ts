import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { RefreshTokenAuthGuard } from './guards/refresh-token-auth.guard';

const authClientModule = ClientsModule.register([
  {
    name: 'AUTH',
    transport: Transport.TCP,
    options: {
      port: 3002,
      timeout: 5000,
    },
  },
]);

@Module({
  imports: [
    authClientModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'your-super-secret-jwt-key-change-this-in-production',
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    RefreshTokenStrategy,
    JwtAuthGuard,
    RefreshTokenAuthGuard,
  ],
  exports: [authClientModule, JwtAuthGuard, RefreshTokenAuthGuard],
})
export class AuthModule {}
