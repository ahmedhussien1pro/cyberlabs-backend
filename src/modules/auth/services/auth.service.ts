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

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private hashingService: HashingService,
    private jwtService: JwtTokenService,
    private emailVerificationService: EmailVerificationService,
    private logger: LoggerService,
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
      throw new ConflictException('Name already registered');
    }
    if (existingUser) {
      throw new ConflictException('Email already registered');
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
      expiresIn: 900,
    };
  }

  /**
   * Login user
   */
  async login(dto: LoginDto) {
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

    this.logger.log(`User logged in: ${user.email}`);

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
      expiresIn: 900,
    };
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
        expiresIn: 900,
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
      expiresIn: 900,
    };
  }
}
