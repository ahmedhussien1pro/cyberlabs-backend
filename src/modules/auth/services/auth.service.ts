import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../../core/database';
import { HashingService } from '../../../core/security';
import { LoggerService } from '../../../core/logger';
import { JwtTokenService } from './jwt.service';
import { EmailVerificationService } from './email-verification.service';
import { RegisterDto, LoginDto } from '../dto';
import { UserRole } from '../../../common/enums';
import { OAuthProfile } from '../../../common/types';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationEvents } from '../../notifications/notifications.events';

/** SHA-256 hash للـ token قبل ما يتحفظ في DB */
const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

/** 7 أيام بالـ milliseconds */
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly accessExpirySeconds: number;

  constructor(
    private prisma: PrismaService,
    private hashingService: HashingService,
    private jwtService: JwtTokenService,
    private emailVerificationService: EmailVerificationService,
    private logger: LoggerService,
    private configService: ConfigService,
    private readonly notifications: NotificationsService,
  ) {
    this.logger.setContext('AuthService');
    const raw = this.configService.get<string>('jwt.accessExpiry') ?? '15m';
    this.accessExpirySeconds = this.parseExpiryToSeconds(raw);
  }

  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900;
    const value = parseInt(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * (multipliers[unit] ?? 60);
  }

  // ─── احفظ refreshToken في DB ───────────────────────────────────────────────
  private async saveRefreshToken(
    userId: string,
    refreshToken: string,
    meta?: { ip?: string; userAgent?: string },
  ): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

    // cleanup: احذف المنتهية والمبطلة للمستخدم ده فقط
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null } },
        ],
      },
    });

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt, ip: meta?.ip, userAgent: meta?.userAgent },
    });
  }

  // ─── تحقق من DB إن الـ token صالح ────────────────────────────────────────
  private async validateRefreshTokenInDb(
    userId: string,
    refreshToken: string,
  ): Promise<{ id: string }> {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { userId, tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true },
    });
    if (!stored) throw new UnauthorizedException('Refresh token is invalid or expired');
    return stored;
  }

  // ─── ابطل token واحد (rotation) ──────────────────────────────────────────
  private async revokeRefreshToken(id: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  // ─── ابطل كل tokens المستخدم (logout) ────────────────────────────────────
  private async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    const existingName = await this.prisma.user.findUnique({ where: { name: dto.name } });

    if (existingName) throw new ConflictException('UserName already registered, please choose another one');
    if (existingUser) throw new ConflictException('Email already registered, please login or Forgot Password instead');

    const hashedPassword = await this.hashingService.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: `${dto.name}`,
        role: dto.role || UserRole.STUDENT,
        isEmailVerified: false,
        isActive: true,
      },
      select: { id: true, email: true, name: true, role: true, isEmailVerified: true, isActive: true, createdAt: true },
    });

    try {
      await this.emailVerificationService.sendVerificationEmail(user.id, user.email);
      this.logger.log(`✅ Verification email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send verification email: ${error.message}`, error.stack);
    }

    this.logger.log(`New user registered: ${user.email}`);
    this.notifications.notify(user.id, NotificationEvents.register(user.name)).catch(() => {});

    const accessToken = this.jwtService.generateAccessToken(user.id, user.email, user.role as UserRole);
    const refreshToken = this.jwtService.generateRefreshToken(user.id);
    await this.saveRefreshToken(user.id, refreshToken);

    return { user, accessToken, refreshToken, expiresIn: this.accessExpirySeconds };
  }

  // ─────────────────────────────────────────────────────────────────────────
  async login(dto: LoginDto, meta?: { ip?: string; userAgent?: string }): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true, email: true, name: true, avatarUrl: true,
        password: true, role: true, isEmailVerified: true,
        isActive: true, twoFactorEnabled: true,
      },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');

    const isPasswordValid = await this.hashingService.compare(dto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    if (user.twoFactorEnabled) return { requires2fa: true, userId: user.id };

    this.logger.log(`User logged in: ${user.email}`);
    this.notifications.notify(user.id, NotificationEvents.login()).catch(() => {});

    const accessToken = this.jwtService.generateAccessToken(user.id, user.email, user.role as UserRole);
    const refreshToken = this.jwtService.generateRefreshToken(user.id);
    await this.saveRefreshToken(user.id, refreshToken, meta);

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken, expiresIn: this.accessExpirySeconds };
  }

  // ─────────────────────────────────────────────────────────────────────────
  async getUserForToken(userId: string, meta?: { ip?: string; userAgent?: string }): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, avatarUrl: true,
        role: true, isEmailVerified: true, isActive: true, twoFactorEnabled: true,
      },
    });

    if (!user) throw new UnauthorizedException('User not found');
    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');

    this.logger.log(`User logged in via 2FA: ${user.email}`);
    this.notifications.notify(user.id, NotificationEvents.login()).catch(() => {});

    const accessToken = this.jwtService.generateAccessToken(user.id, user.email, user.role as UserRole);
    const refreshToken = this.jwtService.generateRefreshToken(user.id);
    await this.saveRefreshToken(user.id, refreshToken, meta);

    return { user, accessToken, refreshToken, expiresIn: this.accessExpirySeconds };
  }

  // ─────────────────────────────────────────────────────────────────────────
  async refreshToken(token: string, meta?: { ip?: string; userAgent?: string }) {
    try {
      // 1) تحقق من الـ JWT signature
      const payload = this.jwtService.verifyRefreshToken(token);

      // 2) تحقق من DB إن الـ token صالح وغير مبطل
      const stored = await this.validateRefreshTokenInDb(payload.sub, token);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, isActive: true },
      });

      if (!user) throw new UnauthorizedException('User not found');
      if (!user.isActive) throw new UnauthorizedException('Account is deactivated');

      // 3) ابطل الـ token القديم (token rotation)
      await this.revokeRefreshToken(stored.id);

      // 4) أنشئ tokens جديدة واحفظها
      const newAccessToken = this.jwtService.generateAccessToken(user.id, user.email, user.role as UserRole);
      const newRefreshToken = this.jwtService.generateRefreshToken(user.id);
      await this.saveRefreshToken(user.id, newRefreshToken, meta);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn: this.accessExpirySeconds };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  async logout(userId: string) {
    await this.revokeAllUserTokens(userId);
    this.logger.log(`User logged out + all tokens revoked: ${userId}`);
    return { message: 'Logged out successfully' };
  }

  // ─────────────────────────────────────────────────────────────────────────
  async oauthLogin(profile: OAuthProfile, meta?: { ip?: string; userAgent?: string }) {
    let oauthAccount = await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerId: { provider: profile.provider, providerId: profile.providerId } },
      include: {
        user: {
          select: { id: true, email: true, name: true, avatarUrl: true, role: true, isEmailVerified: true, isActive: true },
        },
      },
    });

    let user: any;
    let isNewUser = false;

    if (oauthAccount) {
      user = oauthAccount.user;
      if (!user.isActive) throw new UnauthorizedException('Account is deactivated');
    } else {
      const existingUser = await this.prisma.user.findUnique({ where: { email: profile.email } });
      const existingName = await this.prisma.user.findUnique({ where: { name: `${profile.firstName} ${profile.lastName}` } });

      if (existingName) throw new ConflictException('Name already registered');

      if (existingUser) {
        await this.prisma.oAuthAccount.create({
          data: { provider: profile.provider, providerId: profile.providerId, userId: existingUser.id },
        });
        user = existingUser;
      } else {
        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            name: `${profile.firstName} ${profile.lastName}`,
            avatarUrl: profile.avatar || null,
            password: '',
            role: UserRole.STUDENT,
            isEmailVerified: true,
            isActive: true,
            oauthAccounts: { create: { provider: profile.provider, providerId: profile.providerId } },
          },
          select: { id: true, email: true, name: true, avatarUrl: true, role: true, isEmailVerified: true, isActive: true },
        });
        isNewUser = true;
        this.logger.log(`New user registered via ${profile.provider}: ${user.email}`);
      }
    }

    if (isNewUser) {
      this.notifications.notify(user.id, NotificationEvents.register(user.name)).catch(() => {});
    } else {
      this.notifications.notify(user.id, NotificationEvents.login()).catch(() => {});
    }

    const accessToken = this.jwtService.generateAccessToken(user.id, user.email, user.role as UserRole);
    const refreshToken = this.jwtService.generateRefreshToken(user.id);
    await this.saveRefreshToken(user.id, refreshToken, meta);

    return { user, accessToken, refreshToken, expiresIn: this.accessExpirySeconds };
  }
}
