// src/modules/practice-labs/ac-vuln/labs/lab1/lab1.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
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

  // ❌ الثغرة: IDOR — يجلب السجل الطبي بناءً على patientId بدون التحقق من ownership
  async getRecord(userId: string, labId: string, patientId: string) {
    if (!patientId) {
      throw new BadRequestException('patientId parameter is required');
    }

    // ❌ لا يوجد check: هل patientId ينتمي للمستخدم الحالي؟
    const record = await this.prisma.labGenericContent.findFirst({
      where: {
        userId,
        labId,
        title: patientId, // patientId مخزّن في title
      },
    });

    if (!record) {
      return {
        success: false,
        error: 'Patient record not found',
        hint: 'Try different patient IDs. VIP patients use format: HC-VIP-XXXX',
      };
    }

    let recordData: any = {};
    try {
      recordData = JSON.parse(record.body);
    } catch {
      recordData = { raw: record.body };
    }

    // التحقق من الوصول إلى VIP record
    if (record.author === 'vip' && patientId === 'HC-VIP-2026') {
      return {
        success: true,
        exploited: true,
        patientId,
        record: recordData,
        flag: 'FLAG{IDOR_HEALTHCARE_PHI_LEAK_2026}',
        vulnerability: 'IDOR (Insecure Direct Object Reference)',
        impact:
          'You accessed a VIP patient record without authorization. ' +
          'In a real healthcare system, this would be a HIPAA violation with severe legal consequences.',
        fix:
          'Always verify that the requested patientId belongs to the authenticated user: ' +
          'WHERE patientId = ? AND userId = authenticatedUserId',
      };
    }

    return {
      success: true,
      exploited: false,
      patientId,
      record: recordData,
      note:
        record.author === 'patient'
          ? 'You accessed another patient record (not the target). Keep exploring.'
          : 'This is your own record.',
    };
  }
}
