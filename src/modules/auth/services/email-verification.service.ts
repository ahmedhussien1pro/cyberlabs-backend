import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database';
import { LoggerService } from '../../../core/logger';
import { MailService } from '../../../core/mail';
import * as crypto from 'crypto';

@Injectable()
export class EmailVerificationService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private mailService: MailService,
  ) {
    this.logger.setContext('EmailVerificationService');
  }

  /**
   * Generate 6-digit OTP
   */
  private generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Send OTP verification email
   */
  async sendVerificationEmail(userId: string, email: string): Promise<void> {
    try {
      // Generate OTP
      const otp = this.generateOTP();
      const expirationTime = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Delete old validation number for this user (إذا موجود)
      await this.prisma.validationNumber.deleteMany({
        where: { userId },
      });

      // Create new validation number
      await this.prisma.validationNumber.create({
        data: {
          userId,
          number: otp,
          expiration: BigInt(expirationTime),
          isVerified: false,
          used: false,
        },
      });

      // Get user name
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      // تحقق من وجود المستخدم 🎯
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Send email with OTP
      await this.mailService.sendOTPEmail(email, user.name, otp);

      this.logger.log(`✅ OTP sent to ${email}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send OTP: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify email with OTP
   */
  async verifyEmailWithOTP(email: string, otp: string): Promise<void> {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        ValidationNumber: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already verified
    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Find validation number
    const validationNumber = user.ValidationNumber.find(
      (vn) => vn.number === otp && !vn.used,
    );

    if (!validationNumber) {
      throw new BadRequestException('Invalid OTP code');
    }

    // Check if expired
    const now = BigInt(Date.now());
    if (now > validationNumber.expiration) {
      await this.prisma.validationNumber.delete({
        where: { id: validationNumber.id },
      });
      throw new BadRequestException('OTP code has expired');
    }

    // Mark as verified and used
    await this.prisma.validationNumber.update({
      where: { id: validationNumber.id },
      data: {
        isVerified: true,
        used: true,
      },
    });

    // Update user email verification
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    // Send welcome email
    await this.mailService.sendWelcomeEmail(email, user.name);

    this.logger.log(`✅ Email verified for user: ${email}`);
  }

  /**
   * Resend verification OTP
   */
  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    await this.sendVerificationEmail(user.id, user.email);
  }

  /**
   * Verify email with token (للـ backward compatibility)
   * @deprecated استخدم verifyEmailWithOTP بدلاً منها */
  async verifyEmail(token: string): Promise<void> {
    throw new BadRequestException(
      'Token verification is deprecated. Please use OTP verification instead.',
    );
  }
}
