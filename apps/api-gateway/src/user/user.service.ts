import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  private users = [
    {
      id: '123',
      name: 'userTest',
    },
  ];

  async getUserProfile(userId: string) {
    return this.users.find((u) => u.id === userId) || null;
  }
}
