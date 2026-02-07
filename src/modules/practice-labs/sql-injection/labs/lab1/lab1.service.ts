import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab1Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // ❌ الثغرة: SQL Injection في الـ Login
  async login(
    userId: string,
    labId: string,
    username: string,
    password: string,
  ) {
    try {
      // ❌ الثغرة: بناء Query بدون Parameterization!
      const query = `
        SELECT * FROM "LabGenericUser" 
        WHERE "userId" = '${userId}' 
        AND "labId" = '${labId}' 
        AND "username" = '${username}' 
        AND "password" = '${password}'
      `;

      const users = await this.prisma.$queryRawUnsafe(query);
      const user = (users as any[])[0];

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // التحقق من تحقيق الهدف
      if (user.role === 'ADMIN') {
        return {
          success: true,
          username: user.username,
          role: user.role,
          flag: 'FLAG{SQLI_AUTH_BYPASS_MASTER}',
          exploited: true,
          message: 'SQL Injection successful! Logged in as admin',
        };
      }

      return { success: true, username: user.username, role: user.role };
    } catch (error) {
      throw new UnauthorizedException('Login failed');
    }
  }
}
