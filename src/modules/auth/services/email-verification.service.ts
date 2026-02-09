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
   * ✅ CRITICAL: ValidationNumber is created FIRST, then email is attempted
   */
  async sendVerificationEmail(userId: string, email: string): Promise<void> {
    // Generate OTP
    const otp = this.generateOTP();
    const expirationTime = Date.now() + 10 * 60 * 1000; // 10 minutes

    // ✅ STEP 1: Create ValidationNumber FIRST (this MUST succeed)
    // This ensures OTP exists in DB even if email fails
    try {
      // Delete old validation numbers for this user
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

      this.logger.log(
        `✅ ValidationNumber created successfully for user: ${userId}, OTP: ${otp}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ CRITICAL: Failed to create ValidationNumber for user ${userId}: ${error.message}`,
        error.stack,
      );
      // This MUST fail registration - can't proceed without ValidationNumber
      throw new Error('Failed to create verification code. Please try again.');
    }

    // ✅ STEP 2: Get user details
    let userName = 'User'; // Default fallback
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      if (user && user.name) {
        userName = user.name;
      }
    } catch (error) {
      this.logger.warn(
        `⚠️ Could not fetch user name for ${userId}, using default`,
      );
    }

    // ✅ STEP 3: Try to send email (can fail without breaking registration)
    try {
      await this.mailService.sendOTPEmail(email, userName, otp);
      this.logger.log(`✅ OTP email sent successfully to ${email}`);
    } catch (error) {
      // ⚠️ Email failed but ValidationNumber already exists
      this.logger.error(
        `❌ Failed to send OTP email to ${email}: ${error.message}`,
        error.stack,
      );
      this.logger.warn(
        `⚠️ ValidationNumber exists in DB but email not sent. User can use resend endpoint.`,
      );
      // ✅ DON'T throw - ValidationNumber already created successfully
      // User can request resend later via /resend-verification endpoint
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

    // Try to send welcome email (non-critical)
    try {
      await this.mailService.sendWelcomeEmail(email, user.name);
      this.logger.log(`✅ Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to send welcome email to ${email}: ${error.message}`,
      );
      // Don't fail verification if welcome email fails
    }

    this.logger.log(`✅ Email verified successfully for user: ${email}`);
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
   * Verify email with token (backward compatibility)
   * @deprecated Use verifyEmailWithOTP instead
   */
  async verifyEmail(token: string): Promise<void> {
    throw new BadRequestException(
      'Token verification is deprecated. Please use OTP verification instead.',
    );
  }
}
