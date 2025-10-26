import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../guards/auth/auth.guard';

@Module({
  imports: [AuthModule],
  controllers: [UserController],
  providers: [UserService, AuthGuard],
})
export class UserModule {}
