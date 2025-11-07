import { Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { firstValueFrom } from 'rxjs'

@Injectable()
export class UserService {
  constructor(@Inject('AUTH') private readonly authClient: ClientProxy) {}

  async listUsers(params: {
    search?: string
    page?: number
    size?: number
    ids?: string[]
  }) {
    return firstValueFrom(this.authClient.send('user.list', params))
  }
}
