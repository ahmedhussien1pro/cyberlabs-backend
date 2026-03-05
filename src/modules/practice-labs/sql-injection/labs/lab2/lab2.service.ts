import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import {
  buildLabResult,
  rowsContainValue,
} from '../../../shared/utils/sqli-lab.utils';

@Injectable()
export class Lab2Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // ❌ الثغرة: UNION-based SQLi in the user directory search
  async searchUsers(userId: string, labId: string, searchTerm: string) {
    // ❌ الثغرة: raw string interpolation — no sanitization
    const query = `
      SELECT username, email, role
      FROM   "LabGenericUser"
      WHERE  "userId" = '${userId}'
      AND    "labId"  = '${labId}'
      AND    username ILIKE '%${searchTerm}%'
    `;

    let results: any[] = [];
    try {
      results = (await this.prisma.$queryRawUnsafe(query)) as any[];
    } catch {
      // Real apps swallow DB errors — student probes via behavior, not error text
      results = [];
    }

    // Detection: flag value leaked into any result column via UNION
    const isExploited = rowsContainValue(
      results,
      ['email', 'username', 'role'],
      'FLAG{',
    );

    if (isExploited) {
      return buildLabResult({
        success: true,
        exploited: true,
        data: results,
        flag: 'FLAG{SQLI_UNION_DATA_EXTRACTED}',
        evidence: 'Admin password exposed via UNION injection',
        message: '🎯 UNION injection successful — admin credentials extracted!',
        uiHint: 'You found the admin password. Submit it as the flag.',
      });
    }

    return buildLabResult({
      success: true,
      data: results,
      message: `Found ${results.length} user(s)`,
    });
  }
}
