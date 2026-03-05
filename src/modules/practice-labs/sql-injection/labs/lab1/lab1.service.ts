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

  async login(
    userId: string,
    labId: string,
    username: string,
    password: string,
  ) {
    try {
      const query = `
        SELECT * FROM "LabGenericUser"
        WHERE "userId"   = '${userId}'
        AND   "labId"    = '${labId}'
        AND   "username" = '${username}'
        AND   "password" = '${password}'
      `;

      const users = await this.prisma.$queryRawUnsafe(query);
      const user = (users as any[])[0];

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (user.role?.toLowerCase() === 'admin') {
        return {
          success: true,
          username: user.username,
          role: user.role,
          flag: 'FLAG{SQLI_AUTH_BYPASS_SUCCESS}',
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
