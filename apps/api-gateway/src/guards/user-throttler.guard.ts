import { Injectable } from '@nestjs/common';
import {
  ThrottlerGuard,
  InjectThrottlerOptions,
  InjectThrottlerStorage,
} from '@nestjs/throttler';
import type { ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

interface RequestWithAuth {
  headers?: {
    authorization?: string;
  };
  ip: string;
}

interface DecodedToken {
  id: string;
  email: string;
}

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() protected readonly throttlerOptions: ThrottlerModuleOptions,
    @InjectThrottlerStorage() protected readonly throttlerStorage: ThrottlerStorage,
    protected readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {
    super(throttlerOptions, throttlerStorage, reflector);
  }

  protected async getTracker(req: RequestWithAuth): Promise<string> {
    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const payload = this.jwtService.decode(token) as DecodedToken | null;
        if (payload?.id) {
          return `user:${payload.id}`;
        }
      } catch {
        return req.ip;
      }
    }

    return req.ip;
  }
}
