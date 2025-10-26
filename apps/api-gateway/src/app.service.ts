import { Inject, Injectable } from '@nestjs/common';
import { LoginDto } from '@repo/types';
import { ClientProxy } from '@nestjs/microservices';
import { CreateUserEvent } from './create-user.event';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AppService {
  private readonly users: any[] = [];

  constructor(
    @Inject('NOTIFICATIONS') private readonly notificationsClient: ClientProxy,
  ) {}

  async createUser(credentials: LoginDto) {
    this.users.push(credentials);
    await firstValueFrom(
      this.notificationsClient.emit(
        'user_created',
        new CreateUserEvent(credentials.email),
      ),
    );
    return { success: true, user: credentials };
  }
}
