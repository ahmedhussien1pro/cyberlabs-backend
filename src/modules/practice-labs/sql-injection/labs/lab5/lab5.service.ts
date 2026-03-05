import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import {
  buildLabResult,
  rowsContainValue,
} from '../../../shared/utils/sqli-lab.utils';

@Injectable()
export class Lab5Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async logVisit(userId: string, labId: string, clientIp: string) {
    const ip = (clientIp ?? '127.0.0.1').trim();

    await this.prisma.labGenericLog.create({
      data: { userId, labId, type: 'PAGE_VISIT', action: ip },
    });

    const query = `
      SELECT action AS ip, type, "createdAt"
      FROM   "LabGenericLog"
      WHERE  "userId" = '${userId}'
      AND    "labId"  = '${labId}'
      AND    action   = '${ip}'
      ORDER BY "createdAt" DESC
    `;

    let visits: any[] = [];
    try {
      visits = (await this.prisma.$queryRawUnsafe(query)) as any[];
    } catch {
      visits = [];
    }

    const isExploited = rowsContainValue(visits, ['ip'], 'FLAG{');

    if (isExploited) {
      return buildLabResult({
        success: true,
        exploited: true,
        data: visits,
        flag: 'FLAG{HTTP_HEADER_SQLI_XFF}',
        evidence: 'Admin secret extracted via X-Forwarded-For header injection',
        message:
          '🎯 HTTP Header injection successful! Admin secret leaked via UNION.',
        uiHint: "The flag appears in the 'ip' field. Submit it.",
      });
    }

    return buildLabResult({
      success: true,
      data: visits,
      message: `Visit logged from ${ip}. ${visits.length} previous visit(s) from this IP.`,
    });
  }
}
