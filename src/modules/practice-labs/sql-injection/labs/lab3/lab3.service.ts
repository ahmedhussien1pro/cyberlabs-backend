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

  // ❌ الثغرة: Blind SQL Injection
  async checkUser(userId: string, labId: string, username: string) {
    try {
      // ❌ الثغرة: يسمح بـ Boolean-based injection
      const query = `
        SELECT COUNT(*) as count FROM "LabGenericUser" 
        WHERE "userId" = '${userId}' 
        AND "labId" = '${labId}' 
        AND "username" = '${username}'
      `;

      const result = await this.prisma.$queryRawUnsafe(query);
      const count = (result as any[])[0]?.count || 0;

      // التحقق: لو المستخدم استخدم Blind SQLi للوصول لـ admin username
      if (
        username.toLowerCase().includes('secret_admin') ||
        username.toLowerCase().includes('secret')
      ) {
        // تسجيل محاولة ناجحة
        await this.prisma.labGenericLog.create({
          data: { userId, labId, type: 'AUTH_ATTEMPT' },
        });

        const attempts = await this.prisma.labGenericLog.count({
          where: { userId, labId, type: 'AUTH_ATTEMPT' },
        });

        // لو عمل محاولات كتير (علامة على Blind SQLi)
        if (attempts >= 5) {
          return {
            exists: Number(count) > 0,
            flag: 'FLAG{BLIND_SQLI_BOOLEAN_BASED}',
            exploited: true,
            message: 'Blind SQL Injection successful!',
          };
        }
      }

      return { exists: Number(count) > 0 };
    } catch (error) {
      return { exists: false, error: 'Query failed' };
    }
  }
}
