import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class Lab2Service {
  private readonly WEAK_SECRET = 'password123'; // Weak secret!

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

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const token = jwt.sign(
      { username: user.username, role: user.role },
      this.WEAK_SECRET,
      { algorithm: 'HS256' },
    );

    return {
      token,
      role: user.role,
      hint: 'Secret might be a common password...',
    };
  }

  async verifyToken(userId: string, labId: string, token: string) {
    try {
      const decoded = jwt.verify(token, this.WEAK_SECRET) as any;

      if (decoded.role === 'ADMIN') {
        return {
          success: true,
          role: decoded.role,
          flag: 'FLAG{JWT_WEAK_SECRET_CRACKED}',
          exploited: true,
        };
      }

      return { success: true, role: decoded.role };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
