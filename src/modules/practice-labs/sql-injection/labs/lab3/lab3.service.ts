import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab3Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async checkUser(userId: string, labId: string, username: string) {
    try {
      const query = `
      SELECT COUNT(*) as count FROM "LabGenericUser" 
      WHERE "userId" = '${userId}' 
      AND "labId" = '${labId}' 
      AND "username" = '${username}'
    `;
      const result = await this.prisma.$queryRawUnsafe(query);
      const count = Number((result as any[])[0]?.count ?? 0);

      await this.prisma.labGenericLog.create({
        data: { userId, labId, type: 'AUTH_ATTEMPT', action: username },
      });

      const attempts = await this.prisma.labGenericLog.count({
        where: { userId, labId, type: 'AUTH_ATTEMPT' },
      });

      const hasSqlPattern =
        username.includes("'") ||
        username.toLowerCase().includes(' or ') ||
        username.toLowerCase().includes(' and ');

      if (attempts >= 5 && hasSqlPattern) {
        return {
          exists: count > 0,
          flag: 'FLAG{BLIND_SQLI_BOOLEAN_BASED}',
          exploited: true,
          message: 'Blind SQL Injection successful!',
        };
      }

      return { exists: count > 0 };
    } catch (error) {
      return { exists: false, error: 'Query failed' };
    }
  }
}
