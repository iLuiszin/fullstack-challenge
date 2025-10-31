import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtExpiry = configService.get<string>('JWT_EXPIRY');
        return {
          secret: configService.get<string>('JWT_SECRET') || 'jwt-secret',
          signOptions: {
            expiresIn: jwtExpiry ? parseInt(jwtExpiry, 10) : 1800,
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
          secret: configService.get<string>('JWT_REFRESH_SECRET') || 'refresh-secret',
          signOptions: {
            expiresIn: refreshExpiry ? parseInt(refreshExpiry, 10) : 604800,
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
