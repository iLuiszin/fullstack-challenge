import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ValidateTokenResponse } from '@repo/types';
import { firstValueFrom, Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject('AUTH') private readonly authClient: ClientProxy) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader: string = req.headers['authorization'];

    if (!authHeader) throw new UnauthorizedException('Token faltando!');

    const accessToken = authHeader.split(' ')[1];
    const result: ValidateTokenResponse = await firstValueFrom(
      this.authClient.send('validate-token', accessToken),
    );

    if (!result.valid) {
      throw new UnauthorizedException('Token inválido!');
    }

    req.user = { userId: result.userId, role: result.role };

    return true;
  }
}
