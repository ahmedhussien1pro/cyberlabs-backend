// src/modules/practice-labs/jwt/labs/lab1/lab1.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class Lab1Service {
  private readonly JWT_SECRET = 'lab1_secure_secret_key_2026';

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // يصدر JWT token عادي (HS256) للمستخدم
  async login(userId: string, labId: string, username: string) {
    if (!username) {
      throw new BadRequestException('username is required');
    }

    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const token = jwt.sign(
      { username: user.username, role: user.role },
      this.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '1h' },
    );

    return {
      success: true,
      token,
      user: {
        username: user.username,
        role: user.role,
      },
      note: 'Use this token to access the admin dashboard. Decode it at jwt.io to understand its structure.',
    };
  }

  // ❌ الثغرة: يقبل "alg: none" بدون توقيع
  async adminDashboard(userId: string, labId: string, authHeader?: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');

    let decoded: any;
    try {
      // فك التشفير بدون التحقق أولاً للحصول على الـ header
      decoded = jwt.decode(token, { complete: true });

      if (!decoded) {
        throw new UnauthorizedException('Invalid token format');
      }

      // ❌ الثغرة: يقبل "alg: none"
      if (
        decoded.header.alg === 'none' ||
        decoded.header.alg === 'None' ||
        decoded.header.alg === 'NONE'
      ) {
        // يتحقق فقط من وجود payload بدون التحقق من التوقيع!
        decoded = decoded.payload;
      } else {
        // التحقق العادي للـ signed tokens
        decoded = jwt.verify(token, this.JWT_SECRET, { algorithms: ['HS256'] });
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // التحقق من role
    if (decoded.role !== 'admin') {
      throw new UnauthorizedException({
        error: 'Access denied',
        message: 'Admin role required',
        yourRole: decoded.role,
        hint: 'Decode your token and modify the role. But how to bypass signature verification?',
      });
    }

    // إذا وصل هنا، معناها role === 'admin'
    const allUsers = await this.prisma.labGenericUser.findMany({
      where: { userId, labId },
      select: { username: true, role: true, email: true },
    });

    // تحقق من أن المستخدم استخدم "alg: none"
    const isExploited =
      decoded.alg === 'none' ||
      (
        jwt.decode(token, { complete: true }) as any
      )?.header?.alg?.toLowerCase() === 'none';

    if (isExploited) {
      return {
        success: true,
        exploited: true,
        admin: decoded.username,
        users: allUsers,
        dashboardData: {
          totalUsers: allUsers.length,
          adminCount: allUsers.filter((u) => u.role === 'admin').length,
        },
        flag: 'FLAG{JWT_ALG_NONE_UNSIGNED_TOKEN_BYPASS}',
        vulnerability: 'JWT Algorithm Confusion — None Algorithm',
        impact:
          'You bypassed signature verification by using "alg: none". ' +
          'This allowed you to forge an admin token without knowing the secret key.',
        fix:
          'Never accept "alg: none" tokens in production. ' +
          'Explicitly whitelist allowed algorithms: jwt.verify(token, secret, { algorithms: ["HS256"] })',
      };
    }

    return {
      success: true,
      exploited: false,
      admin: decoded.username,
      users: allUsers,
      note: 'You accessed the dashboard with a valid signed token, not exploiting the vulnerability.',
    };
  }
}
