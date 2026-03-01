import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
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

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private hashingService: HashingService,
    private jwtService: JwtTokenService,
    private emailVerificationService: EmailVerificationService,
    private logger: LoggerService,
    private readonly notifications: NotificationsService,
  ) {
    this.logger.setContext('AuthService');
  }

  /**
   * Register new user
   */
  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    const existingName = await this.prisma.user.findUnique({
      where: { name: dto.name },
    });

    if (existingName) {
      throw new ConflictException(
        'UserName already registered, please choose another one',
      );
    }
    if (existingUser) {
      throw new ConflictException(
        'Email already registered, please login or Forgot Password instead',
      );
    }

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
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    // ✅ Wrap email sending in try-catch to ensure registration succeeds even if email fails
    try {
      await this.emailVerificationService.sendVerificationEmail(
        user.id,
        user.email,
      );
      this.logger.log(
        `✅ Verification email sent successfully to ${user.email}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to send verification email to ${user.email}: ${error.message}`,
        error.stack,
      );
    }

    this.logger.log(`New user registered: ${user.email}`);
    this.notifications
      .notify(user.id, NotificationEvents.register(user.name))
      .catch(() => {});
    const accessToken = this.jwtService.generateAccessToken(
      user.id,
      user.email,
      user.role as UserRole,
    );
    const refreshToken = this.jwtService.generateRefreshToken(user.id);

    return {
      user,
      accessToken,
      refreshToken,
      expiresIn: 2000,
    };
  }

  /**
   * Login user.
   * Returns { requires2fa: true, userId } if TOTP is enabled.
   * Returns { user, accessToken, refreshToken } on normal login.
   */
  async login(dto: LoginDto): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        password: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await this.hashingService.compare(
      dto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2FA is enabled — frontend must complete TOTP challenge before getting tokens
    if (user.twoFactorEnabled) {
      return {
        requires2fa: true,
        userId: user.id,
      };
    }

    this.logger.log(`User logged in: ${user.email}`);
    this.notifications
      .notify(user.id, NotificationEvents.login())
      .catch(() => {});

    const accessToken = this.jwtService.generateAccessToken(
      user.id,
      user.email,
      user.role as UserRole,
    );
    const refreshToken = this.jwtService.generateRefreshToken(user.id);

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
      expiresIn: 2000,
    };
  }

  /**
   * Issue a full session after successful 2FA TOTP verification.
   */
  async getUserForToken(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    this.logger.log(`User logged in via 2FA: ${user.email}`);
    this.notifications
      .notify(user.id, NotificationEvents.login())
      .catch(() => {});

    const accessToken = this.jwtService.generateAccessToken(
      user.id,
      user.email,
      user.role as UserRole,
    );
    const refreshToken = this.jwtService.generateRefreshToken(user.id);

    return { user, accessToken, refreshToken, expiresIn: 2000 };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verifyRefreshToken(refreshToken);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      const newAccessToken = this.jwtService.generateAccessToken(
        user.id,
        user.email,
        user.role as UserRole,
      );
      const newRefreshToken = this.jwtService.generateRefreshToken(user.id);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 2000,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string) {
    this.logger.log(`User logged out: ${userId}`);
    return {
      message: 'Logged out successfully',
    };
  }

  /**
   * OAuth Login/Register (Google, GitHub)
   */
  async oauthLogin(profile: OAuthProfile) {
    let oauthAccount = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider: profile.provider,
          providerId: profile.providerId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            role: true,
            isEmailVerified: true,
            isActive: true,
          },
        },
      },
    });

    let user;

    if (oauthAccount) {
      user = oauthAccount.user;

      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }
    } else {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });
      const existingName = await this.prisma.user.findUnique({
        where: { name: `${profile.firstName} ${profile.lastName}` },
      });

      if (existingName) {
        throw new ConflictException('Name already registered');
      }

      if (existingUser) {
        await this.prisma.oAuthAccount.create({
          data: {
            provider: profile.provider,
            providerId: profile.providerId,
            userId: existingUser.id,
          },
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
            oauthAccounts: {
              create: {
                provider: profile.provider,
                providerId: profile.providerId,
              },
            },
          },
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            role: true,
            isEmailVerified: true,
            isActive: true,
          },
        });

        this.logger.log(
          `New user registered via ${profile.provider}: ${user.email}`,
        );
      }
    }
    if (oauthAccount) {
      this.notifications
        .notify(user.id, NotificationEvents.login())
        .catch(() => {});
    }

    const accessToken = this.jwtService.generateAccessToken(
      user.id,
      user.email,
      user.role as UserRole,
    );
    const refreshToken = this.jwtService.generateRefreshToken(user.id);

    return {
      user,
      accessToken,
      refreshToken,
      expiresIn: 2000,
    };
  }
}
