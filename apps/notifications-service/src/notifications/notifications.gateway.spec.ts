import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { PinoLogger } from 'nestjs-pino';
import { NotificationsGateway } from './notifications.gateway';
import { Socket } from 'socket.io';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let jwtService: jest.Mocked<JwtService>;

  const mockSocket = {
    id: 'socket-123',
    handshake: {
      auth: { token: 'valid-token' },
      headers: {},
    },
    data: {},
    join: jest.fn(),
    disconnect: jest.fn(),
    emit: jest.fn(),
  } as unknown as Socket;

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    setContext: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
    jwtService = module.get(JwtService);
    gateway.server = mockServer as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('authenticates user and joins room when token is valid', async () => {
      const payload = { id: 'user-123', email: 'test@example.com' };
      jwtService.verifyAsync.mockResolvedValue(payload);

      await gateway.handleConnection(mockSocket as any);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(
        'valid-token',
        expect.any(Object),
      );
      expect(mockSocket.data).toEqual({ userId: 'user-123' });
      expect(mockSocket.join).toHaveBeenCalledWith('user:user-123');
    });

    it('disconnects socket when token is missing', async () => {
      const socketWithoutToken = {
        ...mockSocket,
        handshake: { auth: {}, headers: {} },
      };

      await gateway.handleConnection(socketWithoutToken as any);

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('disconnects socket when token is invalid', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await gateway.handleConnection(mockSocket as any);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('handles token from authorization header', async () => {
      const socketWithHeader = {
        ...mockSocket,
        handshake: {
          auth: {},
          headers: { authorization: 'Bearer header-token' },
        },
      };
      const payload = { id: 'user-456' };
      jwtService.verifyAsync.mockResolvedValue(payload);

      await gateway.handleConnection(socketWithHeader as any);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(
        'header-token',
        expect.any(Object),
      );
      expect(socketWithHeader.data).toEqual({ userId: 'user-456' });
    });
  });

  describe('handleDisconnect', () => {
    it('removes socket from user tracking', () => {
      const authenticatedSocket = {
        ...mockSocket,
        data: { userId: 'user-123' },
      };

      gateway['userSockets'].set(
        'user-123',
        new Set(['socket-123', 'socket-456']),
      );

      gateway.handleDisconnect(authenticatedSocket as any);

      const userSockets = gateway['userSockets'].get('user-123');
      expect(userSockets?.has('socket-123')).toBe(false);
      expect(userSockets?.has('socket-456')).toBe(true);
    });

    it('cleans up empty user socket sets', () => {
      const authenticatedSocket = {
        ...mockSocket,
        data: { userId: 'user-123' },
      };

      gateway['userSockets'].set('user-123', new Set(['socket-123']));

      gateway.handleDisconnect(authenticatedSocket as any);

      expect(gateway['userSockets'].has('user-123')).toBe(false);
    });
  });

  describe('emitToUser', () => {
    it('emits event to user room', () => {
      const event = 'task:created';
      const data = { taskId: 'task-123', title: 'New Task' };

      gateway.emitToUser('user-123', event, data);

      expect(mockServer.to).toHaveBeenCalledWith('user:user-123');
      expect(mockServer.emit).toHaveBeenCalledWith(event, data);
    });
  });

  describe('afterInit', () => {
    it('logs initialization message', () => {
      const infoSpy = jest.spyOn(gateway['logger'], 'info');

      gateway.afterInit(mockServer as any);

      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('WebSocket Gateway initialized'),
      );
    });
  });
});
