import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { HttpException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import * as argon2 from 'argon2';

jest.mock('argon2');

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;
  let refreshJwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: '123',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedPassword',
    hashedRefreshToken: 'hashedToken',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: 'REFRESH_JWT_SERVICE',
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
            findByUsername: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
            updateHashedRefreshToken: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
    refreshJwtService = module.get('REFRESH_JWT_SERVICE');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'password123',
    };

    it('creates new user with hashed password', async () => {
      userService.findByEmail.mockResolvedValue(null);
      userService.findByUsername.mockResolvedValue(null);
      (argon2.hash as jest.Mock)
        .mockResolvedValueOnce('hashedPassword')
        .mockResolvedValueOnce('hashedRefreshToken');
      userService.create.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('accessToken');
      refreshJwtService.signAsync.mockResolvedValue('refreshToken');
      userService.updateHashedRefreshToken.mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(userService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(userService.findByUsername).toHaveBeenCalledWith(
        registerDto.username,
      );
      expect(argon2.hash).toHaveBeenCalledWith(registerDto.password);
      expect(userService.create).toHaveBeenCalledWith({
        ...registerDto,
        password: 'hashedPassword',
      });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
      });
    });

    it('throws conflict error when email already exists', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      userService.findByUsername.mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(
        HttpException,
      );

      expect(userService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(userService.findByUsername).toHaveBeenCalledWith(
        registerDto.username,
      );
      expect(userService.create).not.toHaveBeenCalled();
    });

    it('throws conflict error when username already exists', async () => {
      userService.findByEmail.mockResolvedValue(null);
      userService.findByUsername.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        HttpException,
      );

      expect(userService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(userService.findByUsername).toHaveBeenCalledWith(
        registerDto.username,
      );
      expect(userService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('returns tokens when credentials are valid', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('accessToken');
      refreshJwtService.signAsync.mockResolvedValue('refreshToken');
      (argon2.hash as jest.Mock).mockResolvedValue('hashedRefreshToken');
      userService.updateHashedRefreshToken.mockResolvedValue(undefined);

      const result = await service.login(loginDto);

      expect(userService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(argon2.verify).toHaveBeenCalledWith(
        mockUser.password,
        loginDto.password,
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('throws unauthorized error when user not found', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(HttpException);

      expect(userService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(argon2.verify).not.toHaveBeenCalled();
    });

    it('throws unauthorized error when password is invalid', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(HttpException);

      expect(argon2.verify).toHaveBeenCalledWith(
        mockUser.password,
        loginDto.password,
      );
    });
  });

  describe('refresh', () => {
    it('generates new tokens when refresh token is valid', async () => {
      const payload = { id: '123', email: 'test@example.com' };
      refreshJwtService.verifyAsync.mockResolvedValue(payload);
      userService.findById.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('newAccessToken');
      refreshJwtService.signAsync.mockResolvedValue('newRefreshToken');
      (argon2.hash as jest.Mock).mockResolvedValue('newHashedRefreshToken');
      userService.updateHashedRefreshToken.mockResolvedValue(undefined);

      const result = await service.refresh('validRefreshToken');

      expect(refreshJwtService.verifyAsync).toHaveBeenCalledWith(
        'validRefreshToken',
      );
      expect(userService.findById).toHaveBeenCalledWith('123');
      expect(result).toHaveProperty('accessToken', 'newAccessToken');
      expect(result).toHaveProperty('refreshToken', 'newRefreshToken');
    });

    it('throws error when refresh token is invalid', async () => {
      refreshJwtService.verifyAsync.mockRejectedValue(
        new Error('Invalid token'),
      );

      await expect(service.refresh('invalidToken')).rejects.toThrow();
    });

    it('throws error when user not found', async () => {
      const payload = { id: '123', email: 'test@example.com' };
      refreshJwtService.verifyAsync.mockResolvedValue(payload);
      userService.findById.mockResolvedValue(null);

      await expect(service.refresh('validToken')).rejects.toThrow(
        HttpException,
      );
    });

    it('throws error when stored refresh token does not match', async () => {
      const payload = { id: '123', email: 'test@example.com' };
      refreshJwtService.verifyAsync.mockResolvedValue(payload);
      userService.findById.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.refresh('validToken')).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('signOut', () => {
    it('clears refresh token successfully', async () => {
      userService.updateHashedRefreshToken.mockResolvedValue(undefined);

      await service.signOut('user-123');

      expect(userService.updateHashedRefreshToken).toHaveBeenCalledWith(
        'user-123',
        null,
      );
    });
  });
});
