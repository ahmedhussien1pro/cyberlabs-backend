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

  generateAccessToken(userId: string, email: string, role: UserRole): string {
    return this.jwtService.sign(
      { sub: userId, email, role, type: 'access' },
      {
        secret: this.configService.get<string>('jwt.accessSecret') || 'access-secret',
        // ✅ كان 'jwt.accessExpiry' غلط — الصح 'jwt.accessExpiry' بعد توحيد configuration.ts
        expiresIn: this.configService.get<string>('jwt.accessExpiry') || '15m',
      },
    );
  }

  generateRefreshToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      {
        secret: this.configService.get<string>('jwt.refreshSecret') || 'refresh-secret',
        // ✅ كان 'jwt.refreshExpiry' غلط — الصح 'jwt.refreshExpiry' بعد توحيد configuration.ts
        expiresIn: this.configService.get<string>('jwt.refreshExpiry') || '7d',
      },
    );
  }

  generateVerificationToken(userId: string, email: string): string {
    return this.jwtService.sign(
      { sub: userId, email, type: 'verification' },
      {
        secret: this.configService.get<string>('jwt.verificationSecret') || 'verification-secret',
        expiresIn: this.configService.get<string>('jwt.verificationExpiry') || '24h',
      },
    );
  }

  generatePasswordResetToken(userId: string, email: string): string {
    return this.jwtService.sign(
      { sub: userId, email, type: 'reset' },
      {
        secret: this.configService.get<string>('jwt.passwordResetSecret') || 'reset-secret',
        expiresIn: this.configService.get<string>('jwt.passwordResetExpiry') || '1h',
      },
    );
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('jwt.accessSecret') || 'access-secret',
    });
  }

  verifyRefreshToken(token: string): JwtPayload {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('jwt.refreshSecret') || 'refresh-secret',
    });
  }

  verifyVerificationToken(token: string): JwtPayload {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('jwt.verificationSecret') || 'verification-secret',
    });
  }

  verifyPasswordResetToken(token: string): JwtPayload {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('jwt.passwordResetSecret') || 'reset-secret',
    });
  }

  decode(token: string): any {
    return this.jwtService.decode(token);
  }
}
