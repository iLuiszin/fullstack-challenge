import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { DEFAULT_RADIX, JWT_CONFIG } from '../constants/config.constants';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtExpiry = configService.get<string>('JWT_EXPIRY');
        return {
          secret: configService.get<string>('JWT_SECRET') ?? JWT_CONFIG.FALLBACK_SECRET,
          signOptions: {
            expiresIn: jwtExpiry
              ? parseInt(jwtExpiry, DEFAULT_RADIX)
              : JWT_CONFIG.DEFAULT_ACCESS_TOKEN_EXPIRY_SECONDS,
          },
        };
      },
    }),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: 'REFRESH_JWT_SERVICE',
      useFactory: (configService: ConfigService) => {
        const refreshExpiry = configService.get<string>('JWT_REFRESH_EXPIRY');
        return new JwtService({
          secret: configService.get<string>('JWT_REFRESH_SECRET') ?? JWT_CONFIG.FALLBACK_REFRESH_SECRET,
          signOptions: {
            expiresIn: refreshExpiry
              ? parseInt(refreshExpiry, DEFAULT_RADIX)
              : JWT_CONFIG.DEFAULT_REFRESH_TOKEN_EXPIRY_SECONDS,
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
