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
import { DEFAULT_RADIX, MICROSERVICE_HOSTS, MICROSERVICE_PORTS, MICROSERVICE_CONFIG } from '../constants/config.constants';

const authClientModule = ClientsModule.register([
  {
    name: 'AUTH',
    transport: Transport.TCP,
    options: {
      host: MICROSERVICE_HOSTS.AUTH,
      port: parseInt(process.env.AUTH_SERVICE_PORT || String(MICROSERVICE_PORTS.AUTH), DEFAULT_RADIX),
      timeout: MICROSERVICE_CONFIG.TIMEOUT_MS,
    },
  },
]);

@Module({
  imports: [
    authClientModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET must be configured');
        }
        return { secret };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    RefreshTokenStrategy,
    JwtAuthGuard,
    RefreshTokenAuthGuard,
  ],
  exports: [authClientModule, JwtModule, JwtAuthGuard, RefreshTokenAuthGuard],
})
export class AuthModule {}
