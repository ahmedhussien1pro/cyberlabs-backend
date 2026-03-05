// src/modules/practice-labs/jwt/labs/lab2/lab2.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class Lab2Service {
  // ❌ الثغرة: weak secret
  private readonly JWT_SECRET = 'secret123';

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

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
      this.JWT_SECRET, // ❌ weak secret
      { algorithm: 'HS256', expiresIn: '1h' },
    );

    return {
      success: true,
      token,
      user: { username: user.username, role: user.role },
      note: 'This token uses HS256 with a weak secret. Try cracking it offline with jwt_tool or use the /jwt/crack endpoint.',
    };
  }

  // محاكاة brute-force (للتعلم)
  async crackJWT(userId: string, labId: string, token: string) {
    if (!token) {
      throw new BadRequestException('token is required');
    }

    // wordlist بسيط للتوضيح
    const commonSecrets = [
      'secret',
      'password',
      'secret123',
      '123456',
      'admin',
      'test',
      'qwerty',
    ];

    for (const secret of commonSecrets) {
      try {
        jwt.verify(token, secret, { algorithms: ['HS256'] });
        return {
          success: true,
          cracked: true,
          secret,
          message: `Secret cracked: "${secret}"`,
          nextStep: 'Use this secret to forge a new JWT with role: "admin"',
        };
      } catch {
        // continue
      }
    }

    return {
      success: false,
      cracked: false,
      message: 'Secret not found in common wordlist',
      hint: 'The secret is one of the most common passwords. Try: secret123',
    };
  }

  async getFreeCourses(userId: string, labId: string) {
    const freeCourses = await this.prisma.labGenericContent.findMany({
      where: { userId, labId, author: 'free' },
    });

    return {
      success: true,
      courses: freeCourses.map((c) => ({
        title: c.title,
        description: c.body,
      })),
    };
  }

  async getPremiumCourses(userId: string, labId: string, authHeader?: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');

    let decoded: any;
    try {
      decoded = jwt.verify(token, this.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (decoded.role !== 'admin') {
      throw new UnauthorizedException({
        error: 'Access denied',
        message: 'Admin role required to access premium courses',
        yourRole: decoded.role,
        hint: 'Crack the JWT secret and forge an admin token',
      });
    }

    const premiumCourses = await this.prisma.labGenericContent.findMany({
      where: { userId, labId, author: 'premium' },
    });

    let courseData: any[] = [];
    for (const course of premiumCourses) {
      try {
        courseData.push({
          title: course.title,
          ...JSON.parse(course.body),
        });
      } catch {
        courseData.push({
          title: course.title,
          description: course.body,
        });
      }
    }

    return {
      success: true,
      exploited: true,
      courses: courseData,
      flag: 'FLAG{JWT_WEAK_SECRET_CRACKED_HS256_ADMIN}',
      vulnerability: 'JWT Weak Secret (HMAC Brute Force)',
      impact:
        'You cracked the weak HMAC secret and forged an admin token. ' +
        'This gave you access to premium content and could lead to full account takeover.',
      fix:
        'Use strong, randomly generated secrets (min 256 bits). ' +
        'Store them securely (environment variables, secret managers). ' +
        'Consider using RS256 (asymmetric) instead of HS256 for public APIs.',
    };
  }
}
