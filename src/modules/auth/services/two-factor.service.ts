import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database';
import { LoggerService } from '../../../core/logger';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TwoFactorService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private configService: ConfigService,
  ) {
    this.logger.setContext('TwoFactorService');
  }

  /**
   * Generate 2FA secret and QR code
   */
  async generateTwoFactorSecret(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException(
        'Two-factor authentication is already enabled',
      );
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${this.configService.get('app.name')} (${user.email})`,
      issuer: this.configService.get('app.name'),
    });

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

    // Save secret (temporarily)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret.base32,
      },
    });

    this.logger.log(`2FA secret generated for user: ${user.email}`);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  }

  /**
   * Enable 2FA by verifying code
   */
  async enableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException(
        'Two-factor secret not found. Generate one first.',
      );
    }

    // Verify code
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Enable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
      },
    });

    this.logger.log(`2FA enabled for user: ${user.email}`);

    return {
      message: 'Two-factor authentication enabled successfully',
    };
  }

  /**
   * Disable 2FA
   */
  async disableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    // Verify code
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret!,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Disable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    this.logger.log(`2FA disabled for user: ${user.email}`);

    return {
      message: 'Two-factor authentication disabled successfully',
    };
  }

  /**
   * Verify 2FA code during login
   */
  async verifyTwoFactorCode(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('Two-factor authentication not enabled');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    return isValid;
  }

  /**
   * Generate backup codes
   */
  async generateBackupCodes(userId: string): Promise<string[]> {
    const backupCodes: string[] = [];

    for (let i = 0; i < 10; i++) {
      const code = speakeasy
        .generateSecret({ length: 8 })
        .base32.substring(0, 8);
      backupCodes.push(code);
    }

    // Save hashed backup codes to database
    // TODO: Hash backup codes before storing
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        // You'll need to add a backupCodes field to User model
        // backupCodes: backupCodes,
      },
    });

    return backupCodes;
  }
}
