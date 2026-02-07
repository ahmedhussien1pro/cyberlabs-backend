import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab2Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // ❌ الثغرة: UNION-based SQL Injection
  async searchUser(userId: string, labId: string, searchTerm: string) {
    try {
      // ❌ الثغرة: بناء Query بدون Sanitization
      const query = `
        SELECT "username", "email", "role" FROM "LabGenericUser" 
        WHERE "userId" = '${userId}' 
        AND "labId" = '${labId}' 
        AND "username" LIKE '%${searchTerm}%'
      `;

      const results = await this.prisma.$queryRawUnsafe(query);

      // التحقق: لو النتيجة فيها password (من UNION attack)
      const hasPassword = (results as any[]).some((r) => r.password);
      const hasFlag = (results as any[]).some(
        (r) => r.password?.includes('FLAG') || r.email?.includes('FLAG'),
      );

      if (hasFlag) {
        return {
          success: true,
          data: results,
          exploited: true,
          message: 'SQL Injection successful! Admin password extracted',
        };
      }

      return { success: true, data: results };
    } catch (error) {
      throw new NotFoundException('Search failed');
    }
  }
}
