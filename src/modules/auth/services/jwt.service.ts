import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { JwtPayload } from '../../../common/types';
import { UserRole } from '../../../common/enums';

@Injectable()
export class JwtTokenService {
  constructor(
    private jwtService: NestJwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Generate Access Token
   */
  generateAccessToken(userId: string, email: string, role: UserRole): string {
    const payload = {
      sub: userId,
      email,
      role,
      type: 'access',
    };

    return this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>('jwt.accessSecret') || 'access-secret',
      expiresIn: this.configService.get('jwt.accessExpiry') || '15m',
    });
  }

  /**
   * Generate Refresh Token
   */
  generateRefreshToken(userId: string): string {
    const payload = {
      sub: userId,
      type: 'refresh',
    };

    return this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>('jwt.refreshSecret') || 'refresh-secret',
      expiresIn: this.configService.get('jwt.refreshExpiry') || '7d',
    });
  }

  /**
   * Generate Email Verification Token
   */
  generateVerificationToken(userId: string, email: string): string {
    const payload = {
      sub: userId,
      email,
      type: 'verification',
    };

    return this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>('jwt.verificationSecret') ||
        'verification-secret',
      expiresIn: '24h',
    });
  }

  /**
   * Generate Password Reset Token
   */
  generatePasswordResetToken(userId: string, email: string): string {
    const payload = {
      sub: userId,
      email,
      type: 'reset',
    };

    return this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>('jwt.passwordResetSecret') ||
        'reset-secret',
      expiresIn: '1h',
    });
  }

  /**
   * Verify Access Token
   */
  verifyAccessToken(token: string): any {
    return this.jwtService.verify(token, {
      secret:
        this.configService.get<string>('jwt.accessSecret') || 'access-secret',
    });
  }

  /**
   * Verify Refresh Token
   */
  verifyRefreshToken(token: string): any {
    return this.jwtService.verify(token, {
      secret:
        this.configService.get<string>('jwt.refreshSecret') || 'refresh-secret',
    });
  }

  /**
   * Verify Verification Token
   */
  verifyVerificationToken(token: string): any {
    return this.jwtService.verify(token, {
      secret:
        this.configService.get<string>('jwt.verificationSecret') ||
        'verification-secret',
    });
  }

  /**
   * Verify Password Reset Token
   */
  verifyPasswordResetToken(token: string): any {
    return this.jwtService.verify(token, {
      secret:
        this.configService.get<string>('jwt.passwordResetSecret') ||
        'reset-secret',
    });
  }

  /**
   * Decode token without verification (for debugging)
   */
  decode(token: string): any {
    return this.jwtService.decode(token);
  }
}
