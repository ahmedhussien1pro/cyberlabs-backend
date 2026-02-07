import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database';
import { LoggerService } from '../../../core/logger';
import { HashingService } from '../../../core/security';
import { JwtTokenService } from './jwt.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PasswordResetService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtTokenService,
    private hashingService: HashingService,
    private logger: LoggerService,
    private configService: ConfigService,
  ) {
    this.logger.setContext('PasswordResetService');
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      this.logger.warn(
        `Password reset requested for non-existent email: ${email}`,
      );
      return;
    }

    // Generate reset token
    const token = this.jwtService.generatePasswordResetToken(user.id, email);

    // Create reset URL
    const frontendUrl =
      this.configService.get<string>('app.frontendUrl') ||
      'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    // TODO: Send email using mail service
    this.logger.log(`Password reset URL for ${email}: ${resetUrl}`);

    // In production:
    // await this.mailService.sendPasswordResetEmail(email, resetUrl);
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Verify token
      const payload = this.jwtService.verifyPasswordResetToken(token);

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Hash new password
      const hashedPassword = await this.hashingService.hash(newPassword);

      // Update password
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      this.logger.log(`Password reset successful for user: ${user.email}`);
    } catch (error) {
      this.logger.error('Password reset failed', error.stack);
      throw new BadRequestException('Invalid or expired reset token');
    }
  }

  /**
   * Change password (for authenticated users)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isValid = await this.hashingService.compare(
      currentPassword,
      user.password,
    );

    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await this.hashingService.hash(newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    this.logger.log(`Password changed for user: ${user.email}`);
  }
}
