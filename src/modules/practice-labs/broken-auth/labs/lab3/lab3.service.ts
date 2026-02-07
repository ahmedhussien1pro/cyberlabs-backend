import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class Lab3Service {
  // ❌ الثغرة: Weak JWT secret
  private readonly JWT_SECRET = 'secret'; // ❌ ضعيف جداً!

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async login(
    userId: string,
    labId: string,
    username: string,
    password: string,
  ) {
    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username, password },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // إنشاء JWT token بـ weak secret
    const token = jwt.sign(
      {
        username: user.username,
        role: user.role,
        labId,
      },
      this.JWT_SECRET,
      { expiresIn: '1h' },
    );

    return {
      success: true,
      token,
      hint: 'JWT secret is very weak...',
    };
  }

  // ❌ الثغرة: يثق في الـ JWT بدون proper validation
  async verifyToken(userId: string, labId: string, token: string) {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;

      return {
        success: true,
        decoded,
        message: 'Token is valid',
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  // ❌ الثغرة: يعتمد على role في الـ token بدون cross-check مع DB
  async accessAdminPanel(userId: string, labId: string, token: string) {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;

      // ❌ الثغرة: يثق في role من الـ token بدون verification
      if (decoded.role !== 'ADMIN') {
        throw new UnauthorizedException('Admin access required');
      }

      // التحقق من الاستغلال
      const actualUser = await this.prisma.labGenericUser.findFirst({
        where: { userId, labId, username: decoded.username },
      });

      if (actualUser && actualUser.role !== 'ADMIN') {
        // المستخدم عدّل الـ token!
        return {
          success: true,
          exploited: true,
          flag: 'FLAG{JWT_TOKEN_MANIPULATED}',
          message:
            'JWT vulnerability exploited! Token manipulated to gain admin access',
          adminData: 'Sensitive admin information',
          realRole: actualUser.role,
          tokenRole: decoded.role,
        };
      }

      return {
        success: true,
        adminData: 'Sensitive admin information',
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  // ❌ الثغرة: Weak algorithm (يمكن استخدام "none")
  async verifyTokenUnsafe(userId: string, labId: string, token: string) {
    try {
      // ❌ الثغرة: يقبل algorithm "none"
      const decoded = jwt.decode(token) as any;

      if (!decoded) {
        throw new UnauthorizedException('Invalid token');
      }

      return {
        success: true,
        decoded,
        warning: 'Token decoded without signature verification!',
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  // Hint للمساعدة
  async getHint(userId: string, labId: string) {
    return {
      hints: [
        'The JWT secret is extremely weak',
        'Try common secrets like: secret, password, 123456',
        'You can decode JWT at jwt.io',
        'Try to modify the role in the token payload',
      ],
    };
  }
}
