import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwt: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    jwt = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if email exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@example.com' });

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully register a customer', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(null) // first check
        .mockResolvedValueOnce({
          id: 'user-1',
          email: 'new@example.com',
          firstName: 'New',
          lastName: 'User',
          role: 'CUSTOMER',
          password: 'hashed-password',
        }); // post create

      prisma.user.create.mockResolvedValue({ id: 'user-1' });

      const result = await service.register({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      });

      expect(result).toHaveProperty('token', 'mock-jwt-token');
      expect(result.user).toHaveProperty('email', 'new@example.com');
      expect(result.user).not.toHaveProperty('password');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        password: await bcrypt.hash('realpassword', 10),
        isActive: true,
      });

      await expect(
        service.login({ email: 'user@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should successfully login and return JWT token', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        password: hashedPassword,
        isActive: true,
        role: 'CUSTOMER',
      });

      const result = await service.login({
        email: 'user@example.com',
        password: 'correctpassword',
      });

      expect(result).toHaveProperty('token', 'mock-jwt-token');
      expect(result.user.email).toBe('user@example.com');
    });
  });
});
