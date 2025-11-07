import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { LoginDto, RegisterDto, ListUsersDto } from '@repo/dto'
import { AuthService } from './auth.service'
import { UserService } from '../user/user.service'

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @MessagePattern('auth-register')
  async register(@Payload() credentials: RegisterDto) {
    return this.authService.register(credentials);
  }

  @MessagePattern('auth-login')
  async login(@Payload() credentials: LoginDto) {
    return this.authService.login(credentials);
  }

  @MessagePattern('auth-refresh')
  async refresh(@Payload() refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @MessagePattern('auth-sign-out')
  async signOut(@Payload() userId: string) {
    return this.authService.signOut(userId);
  }

  @MessagePattern('user.list')
  async listUsers(@Payload() params: ListUsersDto) {
    return this.userService.findAll(params)
  }
}
