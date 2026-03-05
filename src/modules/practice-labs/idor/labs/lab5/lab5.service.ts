// src/modules/practice-labs/idor/labs/lab5/lab5.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab5Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async getMyReports(userId: string, labId: string) {
    const myReport = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, title: 'RPT-5001' },
    });

    return {
      success: true,
      reports: myReport
        ? [{ reportId: myReport.title, ...JSON.parse(myReport.body) }]
        : [],
      batchEndpoint:
        'POST /reports/batch accepts { reportIds: string[] } for bulk retrieval',
      note: 'Your report is RPT-5001. The batch endpoint was built for dashboard performance. Try requesting multiple IDs at once.',
    };
  }

  // ❌ الثغرة: batch IDOR — بدون ownership check على أي ID
  async batchReports(userId: string, labId: string, reportIds: string[]) {
    if (!reportIds || !Array.isArray(reportIds)) {
      throw new BadRequestException('reportIds must be an array of report IDs');
    }
    if (reportIds.length === 0) {
      throw new BadRequestException('reportIds array cannot be empty');
    }
    if (reportIds.length > 20) {
      throw new BadRequestException('Maximum 20 reportIds per batch request');
    }

    // ❌ الثغرة: يجلب كل report بدون التحقق من ownership
    const results: any[] = [];
    let ceoReportFound = false;
    let accessedForeignReports = 0;

    for (const reportId of reportIds) {
      const report = await this.prisma.labGenericContent.findFirst({
        where: { userId, labId, title: reportId },
      });

      if (report) {
        let reportData: any = {};
        try {
          reportData = JSON.parse(report.body);
        } catch {}

        if (report.author === 'ceo_report') ceoReportFound = true;
        if (reportId !== 'RPT-5001') accessedForeignReports++;

        results.push({ reportId, ...reportData });
      } else {
        results.push({ reportId, error: 'Not found' });
      }
    }

    // تسجيل
    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: ceoReportFound ? 'EXPLOIT' : 'API_CALL',
        action: 'BATCH_REPORT_ACCESS',
        meta: {
          requestedIds: reportIds,
          foundCount: results.filter((r) => !r.error).length,
          ceoReportFound,
          accessedForeignReports,
        },
      },
    });

    if (ceoReportFound) {
      return {
        success: true,
        exploited: true,
        requestedCount: reportIds.length,
        returnedCount: results.filter((r) => !r.error).length,
        reports: results,
        flag: 'FLAG{IDOR_BATCH_API_MASS_EXFILTRATION_CEO_REPORT}',
        vulnerability: 'IDOR — Batch API Mass Data Exfiltration',
        impact: `You exfiltrated ${accessedForeignReports} reports belonging to other users/organizations, including the CEO's TOP SECRET executive report with acquisition plans, layoff schedules, and product roadmaps.`,
        fix: [
          'Filter each ID against ownership: WHERE reportId IN (?) AND ownerId = authenticatedUserId',
          'Implement rate limiting on batch endpoints',
          'Log and alert on bulk access patterns',
          'Classify sensitive reports with field-level encryption',
          'Return only IDs owned by the requesting user — silently drop unauthorized ones',
        ],
      };
    }

    return {
      success: true,
      exploited: accessedForeignReports > 0,
      requestedCount: reportIds.length,
      returnedCount: results.filter((r) => !r.error).length,
      reports: results,
      note:
        accessedForeignReports > 0
          ? `⚠️ You accessed ${accessedForeignReports} reports not belonging to you. Keep enumerating to find the CEO report (RPT-5001 through RPT-5015).`
          : 'Tip: The batch endpoint accepts up to 20 IDs. Try a range of sequential IDs.',
    };
  }
}
