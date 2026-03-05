import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import {
  buildLabResult,
  rowsContainValue,
} from '../../../shared/utils/sqli-lab.utils';

@Injectable()
export class Lab4Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async setDisplayName(userId: string, labId: string, displayName: string) {
    await this.prisma.labGenericUser.updateMany({
      where: { userId, labId, username: 'applicant' },
      data: { email: displayName },
    });
    return {
      success: true,
      message: 'Display name updated.',
      stored: displayName,
    };
  }

  async generateReport(userId: string, labId: string) {
    const profile = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username: 'applicant' },
    });

    const storedDisplayName = profile?.email ?? 'applicant';

    const query = `
      SELECT username, email, role
      FROM   "LabGenericUser"
      WHERE  "userId" = '${userId}'
      AND    "labId"  = '${labId}'
      AND    username ILIKE '%${storedDisplayName}%'
    `;

    let results: any[] = [];
    try {
      results = (await this.prisma.$queryRawUnsafe(query)) as any[];
    } catch {
      results = [];
    }

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
        flag: 'FLAG{SECOND_ORDER_SQLI_FIRED}',
        evidence:
          'Admin password leaked via second-order injection in report generator',
        message:
          '🎯 Second-order injection fired! The stored payload executed inside the report query.',
        uiHint: 'The admin password IS the flag. Submit it.',
      });
    }

    return buildLabResult({
      success: true,
      data: results,
      message: `Application report generated for "${storedDisplayName}"`,
    });
  }
}
