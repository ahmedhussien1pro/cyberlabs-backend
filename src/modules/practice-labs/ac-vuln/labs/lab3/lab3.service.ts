// src/modules/practice-labs/ac-vuln/labs/lab3/lab3.service.ts
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

/**
 * Lab 3 — "IDOR: Banking Account Balance Leak"
 *
 *   STEP_1 → Load own account (ACC-1001)         → own balance visible
 *   STEP_2 → Enumerate another account (ACC-1002) → no ownership check discovered
 *   STEP_3 → Access VIP-9876-2026 transactions   → full exploit → dynamic flag
 *
 * /submit requires NO flag input.
 */

const FLAG_PREFIX = 'FLAG{HORIZONTAL_PRIVESC_BANK_IDOR';
const stepStore   = new Map<string, Set<string>>();
const key = (u: string, l: string) => `${u}:${l}`;

@Injectable()
export class Lab3Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    const result = await this.stateService.initializeState(userId, labId);
    stepStore.delete(key(userId, result.labId));
    return { status: 'success', message: 'SecureBank portal initialized' };
  }

  // ❌ IDOR: no ownership check on accountNo
  async getBalance(userId: string, labId: string, accountNo: string) {
    if (!accountNo) throw new BadRequestException('accountNo is required');

    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const k = key(userId, resolvedLabId);
    if (!stepStore.has(k)) stepStore.set(k, new Set());
    const done = stepStore.get(k)!;

    const account = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId: resolvedLabId, accountNo },
    });

    if (!account) {
      return {
        success: false,
        error: 'Account not found',
        hint: 'Try different account numbers. VIP accounts use format: VIP-XXXX-YYYY',
      };
    }

    if (accountNo === 'ACC-1001' && !done.has('STEP_1')) {
      done.add('STEP_1');
      return {
        success: true,
        exploited: false,
        accountNo,
        balance: account.balance,
        ownerName: account.ownerName,
        stepUnlocked: 'STEP_1',
        note: 'Your account loaded. Notice the accountNo parameter — try changing it to access other accounts.',
      };
    }

    if (accountNo !== 'ACC-1001' && accountNo !== 'VIP-9876-2026' && done.has('STEP_1') && !done.has('STEP_2')) {
      done.add('STEP_2');
      return {
        success: true,
        exploited: false,
        accountNo,
        balance: account.balance,
        ownerName: account.ownerName,
        stepUnlocked: 'STEP_2',
        note: 'Another account exposed! No ownership check. Now try the VIP format: VIP-XXXX-YYYY and also fetch /transactions.',
      };
    }

    return {
      success: true,
      exploited: false,
      accountNo,
      balance: account.balance,
      ownerName: account.ownerName,
    };
  }

  // ❌ IDOR: same vulnerability in transactions endpoint
  async getTransactions(userId: string, labId: string, accountNo: string) {
    if (!accountNo) throw new BadRequestException('accountNo is required');

    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const k = key(userId, resolvedLabId);
    if (!stepStore.has(k)) stepStore.set(k, new Set());
    const done = stepStore.get(k)!;

    const account = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId: resolvedLabId, accountNo },
    });

    if (!account) throw new NotFoundException('Account not found');

    const transactions = await this.prisma.labGenericLog.findMany({
      where: { userId, labId: resolvedLabId, type: 'TRANSACTION' },
    });

    const accountTxns = transactions.filter((t) => (t.meta as Record<string, unknown>)?.accountNo === accountNo);

    if (accountNo === 'VIP-9876-2026') {
      done.add('STEP_1');
      done.add('STEP_2');
      done.add('STEP_3');
      return {
        success: true,
        exploited: true,
        accountNo,
        ownerName: account.ownerName,
        balance: account.balance,
        stepUnlocked: 'STEP_3',
        transactions: accountTxns.map((t) => ({ ...(t.meta as Record<string, unknown>), timestamp: t.createdAt })),
        vulnerability: 'Horizontal Privilege Escalation via Parameter Tampering',
        impact: "You accessed a VIP customer's full transaction history without authorization. Critical financial data breach.",
        note: 'All steps complete! Click "Get Your Flag" to claim your reward.',
      };
    }

    return {
      success: true,
      exploited: false,
      accountNo,
      transactions: accountTxns.map((t) => ({ ...(t.meta as Record<string, unknown>), timestamp: t.createdAt })),
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
      message: "You exploited horizontal privilege escalation to access a VIP customer's bank account transactions.",
      explanation:
        'Parameter tampering on accountNo allowed you to access data belonging to other users. ' +
        'Fix: always verify account ownership with WHERE accountNo = ? AND ownerId = authenticatedUserId.',
    };
  }
}
