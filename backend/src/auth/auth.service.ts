import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { Role, VendorStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('An account with this email address already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const role = dto.role || Role.CUSTOMER;

    // Use Prisma transaction to ensure atomic user + role profile creation
    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: dto.email.toLowerCase().trim(),
          password: hashedPassword,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          phone: dto.phone,
          role,
        },
      });

      // Role specific setup
      if (role === Role.VENDOR) {
        const storeName = dto.storeName || `${dto.firstName}'s Store`;
        let slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        if (!slug) slug = `store-${createdUser.id.substring(0, 8)}`;

        // Check if slug exists, append random if needed
        const existingSlug = await tx.vendor.findUnique({ where: { slug } });
        if (existingSlug) {
          slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        await tx.vendor.create({
          data: {
            userId: createdUser.id,
            storeName,
            slug,
            description: dto.storeDescription || 'Welcome to our shop on MarketHub!',
            status: VendorStatus.PENDING,
          },
        });
      } else if (role === Role.DELIVERY_PARTNER) {
        await tx.deliveryPartner.create({
          data: {
            userId: createdUser.id,
            vehicleType: dto.vehicleType || 'Motorcycle',
            vehicleNumber: dto.vehicleNumber || 'PENDING',
          },
        });
      }

      return tx.user.findUnique({
        where: { id: createdUser.id },
        include: { vendorProfile: true, deliveryPartner: true },
      });
    });

    const token = this.generateToken(user);
    const { password, ...safeUser } = user;

    return {
      token,
      user: safeUser,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: {
        vendorProfile: true,
        deliveryPartner: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.generateToken(user);
    const { password, ...safeUser } = user;

    return {
      token,
      user: safeUser,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        vendorProfile: true,
        deliveryPartner: true,
        addresses: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...safeUser } = user;
    return safeUser;
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    // For security, don't reveal if user exists
    return {
      success: true,
      message: 'If that email address is registered, password reset instructions have been sent.',
      // In dev environment, return a mock token for easy testing
      devToken: user ? Buffer.from(`${user.id}:reset-secret`).toString('base64') : null,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      message: 'Password has been successfully updated. You may now log in.',
    };
  }

  private generateToken(user: any): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}
