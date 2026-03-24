// src/modules/practice-labs/ac-vuln/labs/lab1/lab1.service.ts
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

/**
 * Lab 1 — "IDOR: Healthcare Patient Records Leak"
 *
 *   STEP_1 → Load own record (HC-1001)          → discovers IDOR surface
 *   STEP_2 → Enumerate another patient (HC-1002) → understands no ownership check
 *   STEP_3 → Access VIP record (HC-VIP-2026)     → exploit complete → dynamic flag
 *
 * /submit requires NO flag input — flag generated server-side after all steps pass.
 */

const FLAG_PREFIX = 'FLAG{IDOR_HEALTHCARE_PHI_LEAK';
const stepStore   = new Map<string, Set<string>>();
const key = (u: string, l: string) => `${u}:${l}`;

@Injectable()
export class Lab1Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    const result = await this.stateService.initializeState(userId, labId);
    stepStore.delete(key(userId, result.labId));
    return { status: 'success', message: 'Healthcare portal initialized' };
  }

  // ❌ IDOR: no ownership check on patientId
  async getRecord(userId: string, labId: string, patientId: string) {
    if (!patientId) throw new BadRequestException('patientId is required');

    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const k = key(userId, resolvedLabId);
    if (!stepStore.has(k)) stepStore.set(k, new Set());
    const done = stepStore.get(k)!;

    const record = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId: resolvedLabId, title: patientId },
    });

    if (!record) {
      return {
        success: false,
        error: 'Patient record not found',
        hint: 'Try different patient IDs. VIP patients use format: HC-VIP-XXXX',
      };
    }

    let recordData: Record<string, unknown> = {};
    try { recordData = JSON.parse(record.body); } catch { recordData = { raw: record.body }; }

    // STEP_1: own record
    if (patientId === 'HC-1001' && !done.has('STEP_1')) {
      done.add('STEP_1');
      return {
        success: true,
        exploited: false,
        patientId,
        record: recordData,
        stepUnlocked: 'STEP_1',
        note: 'Your own record loaded. Notice the HC-1001 ID in the URL — what happens if you change it?',
      };
    }

    // STEP_2: another non-VIP record
    if (patientId !== 'HC-1001' && patientId !== 'HC-VIP-2026' && done.has('STEP_1') && !done.has('STEP_2')) {
      done.add('STEP_2');
      return {
        success: true,
        exploited: false,
        patientId,
        record: recordData,
        stepUnlocked: 'STEP_2',
        note: 'You accessed another patient record (not the target). The server has no ownership check! Now try the VIP format: HC-VIP-XXXX',
      };
    }

    // STEP_3: VIP record — full exploit
    if (patientId === 'HC-VIP-2026') {
      done.add('STEP_1');
      done.add('STEP_2');
      done.add('STEP_3');
      return {
        success: true,
        exploited: true,
        patientId,
        record: recordData,
        stepUnlocked: 'STEP_3',
        vulnerability: 'IDOR (Insecure Direct Object Reference)',
        impact: 'You accessed a VIP patient record without authorization. In a real healthcare system, this is a HIPAA violation.',
        note: 'All steps complete! Click "Get Your Flag" to claim your reward.',
      };
    }

    return {
      success: true,
      exploited: false,
      patientId,
      record: recordData,
      note: record.author === 'patient' ? 'Another patient record. Keep exploring.' : 'Your own record.',
    };
  }

  async getProgress(userId: string, labId: string) {
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const done = stepStore.get(key(userId, resolvedLabId)) ?? new Set<string>();
    return {
      completedSteps: [...done],
      allStepsDone: done.has('STEP_1') && done.has('STEP_2') && done.has('STEP_3'),
    };
  }

  async submitFlag(userId: string, labId: string) {
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const done = stepStore.get(key(userId, resolvedLabId)) ?? new Set<string>();

    if (!done.has('STEP_1') || !done.has('STEP_2') || !done.has('STEP_3'))
      throw new ForbiddenException('Complete all 3 steps before submitting');

    stepStore.delete(key(userId, resolvedLabId));
    const flag = this.stateService.generateDynamicFlag(FLAG_PREFIX, userId, resolvedLabId);

    return {
      success: true,
      flag,
      message: 'You successfully exploited IDOR in a healthcare portal and accessed PHI without authorization.',
      explanation:
        'IDOR occurs when an application uses user-controlled input to access objects without verifying ownership. ' +
        'Fix: always validate that the requested resource belongs to the authenticated user.',
    };
  }
}
