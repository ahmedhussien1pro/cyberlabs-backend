// src/modules/practice-labs/csrf/labs/lab3/lab3.service.ts
// Refactored (PR #3):
//  - Removed hardcoded flag → FlagPolicyEngine.generate()
//  - Exploit condition → CsrfDetectorEngine.samesiteLaxBypassGet()
//  - FlagRecordService wired in

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import { FlagRecordService } from '../../../shared/services/flag-record.service';
import { FlagPolicyEngine } from '../../../shared/engines/flag-policy.engine';
import { CsrfDetectorEngine } from '../../../shared/engines/csrf-detector.engine';

const LAB_SECRET   = 'csrf_lab3_samesite_lax_get_grade_2025';
const FLAG_PREFIX  = 'CSRF_LAB3';
const TRUSTED_DOMAIN = 'university';

@Injectable()
export class Lab3Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
    private flagRecord: FlagRecordService,
  ) {}

  async initLab(userId: string, labId: string) {
    const state = await this.stateService.initializeState(userId, labId);
    const flag = FlagPolicyEngine.generate(userId, labId, LAB_SECRET, FLAG_PREFIX);
    await this.flagRecord.generateAndStore(userId, labId, 'attempt-1', flag);
    return state;
  }

  async viewGrades(userId: string, labId: string) {
    const grades = await this.prisma.labGenericContent.findMany({
      where: { userId, labId, author: 'grade' },
    });
    return {
      success: true,
      grades: grades.map((g) => ({ recordId: g.title, ...JSON.parse(g.body) })),
      securityNote: 'This portal uses SameSite=Lax cookies. The developer believed this was CSRF-safe. Is it?',
    };
  }

  async updateGrade(
    userId: string, labId: string, studentId: string,
    courseId: string, grade: string, origin?: string,
  ) {
    if (!studentId || !courseId || !grade) {
      throw new BadRequestException('studentId, courseId, and grade are required');
    }

    const record = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, title: `${studentId}-${courseId}` },
    });
    if (!record) throw new BadRequestException('Grade record not found');

    const gradeData = JSON.parse(record.body);
    const oldGrade = gradeData.currentGrade;

    await this.prisma.labGenericContent.update({
      where: { id: record.id },
      data: { body: JSON.stringify({ ...gradeData, currentGrade: grade }) },
    });

    await this.prisma.labGenericLog.create({
      data: {
        userId, labId, type: 'CSRF', action: 'GRADE_UPDATE',
        meta: { studentId, courseId, oldGrade, newGrade: grade, origin: origin || 'top-level-nav' },
      },
    });

    const { exploited, reason } = CsrfDetectorEngine.samesiteLaxBypassGet({
      origin, trustedDomain: TRUSTED_DOMAIN,
    });

    if (exploited && grade === 'A+') {
      const flag = FlagPolicyEngine.generate(userId, labId, LAB_SECRET, FLAG_PREFIX);
      return {
        success: true, exploited: true,
        studentId, courseId, oldGrade, newGrade: grade,
        exploitReason: reason,
        flag,
        vulnerability: 'CSRF — SameSite=Lax Bypass via GET State-Change',
        impact: `Grade changed from ${oldGrade} to A+ via CSRF. SameSite=Lax does NOT protect GET endpoints that modify state.`,
        fix: [
          'Never use GET requests for state-changing operations (violates HTTP semantics)',
          'Use POST + CSRF token for all state changes',
          'SameSite=Strict provides better protection than Lax',
        ],
      };
    }

    return { success: true, studentId, courseId, newGrade: grade, message: 'Grade updated' };
  }

  async simulateNavigation(userId: string, labId: string, studentId: string, courseId: string, grade: string) {
    return this.updateGrade(userId, labId, studentId, courseId, grade, 'https://evil-attacker.com/redirect');
  }
}
