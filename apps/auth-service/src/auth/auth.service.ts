import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  LoginDto,
  JwtPayload,
  AuthResponse,
  ValidateTokenResponse,
  RegisterDto,
  UserResponse,
} from '@repo/types';
import { UserService } from '../user/user.service';
import { hash, verify } from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async register(credentials: RegisterDto): Promise<AuthResponse> {
    const userExists = await this.userService.findByEmail(credentials.email);

    if (userExists) throw new ConflictException('Usuário já cadastrado');

    const hashedPassword = await hash(credentials.password);

    const newUser = await this.userService.create({
      ...credentials,
      password: hashedPassword,
    });

    const payload: JwtPayload = {
      id: newUser.id,
      email: newUser.email,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const userResponse: UserResponse = {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    return {
      accessToken,
      refreshToken,
      user: userResponse,
    };
  }

  async login(credentials: LoginDto): Promise<AuthResponse> {
    const user = await this.userService.findByEmail(credentials.email);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatch = await verify(user.password, credentials.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const userResponse: UserResponse = {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      accessToken,
      refreshToken,
      user: userResponse,
    };
  }

  async validadeLocalUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) throw new UnauthorizedException('Usuário não encontrado!');

    const isPasswordMatched = verify(user.password, password);

    if (!isPasswordMatched)
      throw new UnauthorizedException('Credenciais inválidas!');

    return { id: user.id, email: user.email };
  }

  validateToken(accessToken: string): ValidateTokenResponse {
    try {
      const decoded = this.jwtService.verify<JwtPayload>(accessToken);
      return { valid: true, userId: decoded.id };
    } catch (_error) {
      return { valid: false, userId: null };
    }
  }
}
