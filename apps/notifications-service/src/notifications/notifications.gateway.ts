import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PinoLogger } from 'nestjs-pino';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NOTIFICATIONS_SERVICE_CONFIG, JWT_CONFIG } from '../constants/config.constants';

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? NOTIFICATIONS_SERVICE_CONFIG.DEFAULT_FRONTEND_URL,
    credentials: true,
  },
  namespace: NOTIFICATIONS_SERVICE_CONFIG.WEBSOCKET_NAMESPACE,
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly logger: PinoLogger,
    private readonly jwtService: JwtService,
  ) {
    this.logger.setContext(NotificationsGateway.name);
  }

  afterInit(_server: Server): void {
    this.logger.info('WebSocket Gateway initialized on /notifications');
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token =
        client.handshake.auth?.token ??
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET ?? JWT_CONFIG.FALLBACK_SECRET,
      });
      const userId = payload.id;

      if (!userId) {
        client.disconnect();
        return;
      }

      client.data.userId = userId;
      client.join(`user:${userId}`);

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }

      this.userSockets.get(userId)?.add(client.id);

      client.emit('connected', { userId });
    } catch (error) {
      this.logger.error('Error authenticating socket connection', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    const userId = client.data.userId;

    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
      }
      this.logger.info(`User ${userId} disconnected (socket ${client.id})`);
    }
  }
  emitToUser(userId: string, event: string, data: unknown): void {
    const room = `user:${userId}`;
    this.server.to(room).emit(event, data);

    const socketCount = this.userSockets.get(userId)?.size || 0;
    if (socketCount > 0) {
      this.logger.debug(
        `Emitted '${event}' to user ${userId} (${socketCount} active connections)`,
      );
    }
  }

  broadcast(event: string, data: unknown): void {
    this.server.emit(event, data);
    this.logger.debug(`Broadcasted '${event}' to all connected clients`);
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  getOnlineUserCount(): number {
    return this.userSockets.size;
  }
}
