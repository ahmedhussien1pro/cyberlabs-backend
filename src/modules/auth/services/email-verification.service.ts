import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database';
import { LoggerService } from '../../../core/logger';
import { JwtTokenService } from './jwt.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailVerificationService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtTokenService,
    private logger: LoggerService,
    private configService: ConfigService,
  ) {
    this.logger.setContext('EmailVerificationService');
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(userId: string, email: string): Promise<void> {
    // Generate verification token
    const token = this.jwtService.generateVerificationToken(userId, email);

    // Create verification URL
    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    // TODO: Send email using mail service (we'll create this later)
    // For now, just log it
    this.logger.log(`Verification URL for ${email}: ${verificationUrl}`);

    // In production, you would use nodemailer or a service like SendGrid:
    // await this.mailService.sendVerificationEmail(email, verificationUrl);
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      // Verify token
      const payload = this.jwtService.verifyVerificationToken(token);

      // Update user
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.isEmailVerified) {
        throw new BadRequestException('Email already verified');
      }

      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { isEmailVerified: true },
      });

      this.logger.log(`Email verified for user: ${user.email}`);
    } catch (error) {
      this.logger.error('Email verification failed', error.stack);
      throw new BadRequestException('Invalid or expired verification token');
    }
  }

  /**
   * Resend verification email
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
}
