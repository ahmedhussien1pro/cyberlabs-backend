import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/database';
import { JwtPayload, RequestUser } from '../../../common/types';
import { UserRole } from '../../../common/enums';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('jwt.accessSecret') || 'default-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
        subscriptions: {
          where: {
            isActive: true,
          },
          select: {
            isActive: true,
          },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      isPremium:
        user.subscriptions.length > 0 && user.subscriptions[0].isActive,
    };
  }
}
