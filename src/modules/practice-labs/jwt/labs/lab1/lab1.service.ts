import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class Lab1Service {
  private readonly SECRET = 'lab1-secret-key';

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // تسجيل دخول عادي (يرجع JWT)
  async login(
    userId: string,
    labId: string,
    username: string,
    password: string,
  ) {
    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username, password },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const token = jwt.sign(
      { username: user.username, role: user.role },
      this.SECRET,
      { algorithm: 'HS256' },
    );

    return { token, role: user.role };
  }

  // التحقق من JWT (الثغرة: يقبل "none" algorithm!)
  async verifyToken(userId: string, labId: string, token: string) {
    try {
      // ❌ الثغرة: jwt.verify بدون options يقبل "none" algorithm
      const decoded = jwt.verify(token, this.SECRET, {
        algorithms: ['HS256', 'none'], // الثغرة: يقبل none!
      }) as any;

      // لو المستخدم استغل الثغرة ووصل لـ admin
      if (decoded.role === 'ADMIN') {
        return {
          success: true,
          role: decoded.role,
          flag: 'FLAG{JWT_NONE_ALGORITHM_BYPASSED}',
          exploited: true,
        };
      }

      return { success: true, role: decoded.role };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
