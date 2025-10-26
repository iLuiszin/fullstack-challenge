import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

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
  imports: [authClientModule],
  controllers: [AuthController],
  providers: [],
  exports: [authClientModule],
})
export class AuthModule {}
