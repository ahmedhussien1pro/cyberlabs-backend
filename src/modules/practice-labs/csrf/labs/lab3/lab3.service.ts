// src/modules/practice-labs/csrf/labs/lab3/lab3.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
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

  async viewGrades(userId: string, labId: string) {
    const grades = await this.prisma.labGenericContent.findMany({
      where: { userId, labId, author: 'grade' },
    });

    return {
      success: true,
      grades: grades.map((g) => ({ recordId: g.title, ...JSON.parse(g.body) })),
      securityNote:
        'This portal uses SameSite=Lax cookies. The developer believed this was CSRF-safe. Is it?',
    };
  }

  // ❌ الثغرة: GET request يغيّر state
  async updateGrade(
    userId: string,
    labId: string,
    studentId: string,
    courseId: string,
    grade: string,
    origin?: string,
  ) {
    if (!studentId || !courseId || !grade) {
      throw new BadRequestException(
        'studentId, courseId, and grade are required',
      );
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
        userId,
        labId,
        type: 'CSRF',
        action: 'GRADE_UPDATE',
        meta: {
          studentId,
          courseId,
          oldGrade,
          newGrade: grade,
          origin: origin || 'top-level-nav',
        },
      },
    });

    const isExploited =
      grade === 'A+' && (!origin || !origin.includes('university'));

    if (isExploited) {
      return {
        success: true,
        exploited: true,
        studentId,
        courseId,
        oldGrade,
        newGrade: grade,
        flag: 'FLAG{CSRF_SAMESITE_LAX_BYPASS_GET_STATE_CHANGE_GRADE}',
        vulnerability: 'CSRF — SameSite=Lax Bypass via GET State-Change',
        impact:
          'Grade changed from ' +
          oldGrade +
          ' to A+ via CSRF. SameSite=Lax does NOT protect GET endpoints that modify state.',
        fix: [
          'Never use GET requests for state-changing operations (violates HTTP semantics)',
          'Use POST + CSRF token for all state changes',
          'SameSite=Strict provides better protection than Lax',
          'Validate that grade changes come from authorized professor sessions with additional checks',
        ],
      };
    }

    return {
      success: true,
      studentId,
      courseId,
      newGrade: grade,
      message: 'Grade updated',
    };
  }

  // محاكاة SameSite=Lax bypass عبر top-level navigation
  async simulateNavigation(
    userId: string,
    labId: string,
    studentId: string,
    courseId: string,
    grade: string,
  ) {
    // SameSite=Lax يسمح بالكوكيز في top-level GET navigation
    return this.updateGrade(
      userId,
      labId,
      studentId,
      courseId,
      grade,
      'https://evil-attacker.com/redirect',
    );
  }
}
