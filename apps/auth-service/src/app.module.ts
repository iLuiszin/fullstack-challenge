import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule } from '@nestjs/microservices';

@Module({
  imports: [
    JwtModule.register({
      secret: 'kasodkasdoasdk',
      signOptions: {
        expiresIn: '1h',
      },
    }),
    ClientsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
