// src/modules/practice-labs/ac-vuln/labs/lab3/lab3.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
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

  // ❌ الثغرة: IDOR — يجلب الرصيد بناءً على accountNo بدون التحقق من ownership
  async getBalance(userId: string, labId: string, accountNo: string) {
    if (!accountNo) {
      throw new BadRequestException('accountNo is required');
    }

    // ❌ لا يوجد check: هل accountNo ينتمي للمستخدم الحالي؟
    const account = await this.prisma.labGenericBank.findFirst({
      where: {
        userId,
        labId,
        accountNo,
      },
    });

    if (!account) {
      return {
        success: false,
        error: 'Account not found',
        hint: 'Try different account numbers. VIP accounts use format: VIP-XXXX-YYYY',
      };
    }

    // تحقق من الوصول إلى VIP account
    const isVIPAccount = accountNo === 'VIP-9876-2026';

    if (isVIPAccount) {
      return {
        success: true,
        exploited: true,
        accountNo,
        balance: account.balance,
        ownerName: account.ownerName,
        accountType: 'VIP Premium',
        vulnerability: 'Horizontal Privilege Escalation (IDOR)',
        impact:
          "You accessed another customer's account balance without authorization. " +
          'This is a critical financial data breach.',
        note: 'Request the transactions endpoint with this accountNo to find the flag.',
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

  async getTransactions(userId: string, labId: string, accountNo: string) {
    if (!accountNo) {
      throw new BadRequestException('accountNo is required');
    }

    // ❌ نفس الثغرة: لا يوجد check على ownership
    const account = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId, accountNo },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const transactions = await this.prisma.labGenericLog.findMany({
      where: {
        userId,
        labId,
        type: 'TRANSACTION',
      },
    });

    const accountTransactions = transactions.filter((t) => {
      const meta = t.meta as any;
      return meta?.accountNo === accountNo;
    });

    const isVIPAccount = accountNo === 'VIP-9876-2026';

    if (isVIPAccount && accountTransactions.length > 0) {
      return {
        success: true,
        exploited: true,
        accountNo,
        ownerName: account.ownerName,
        balance: account.balance,
        transactions: accountTransactions.map((t) => ({
          id: t.id,
          ...(t.meta as any),
          timestamp: t.createdAt,
        })),
        flag: 'FLAG{HORIZONTAL_PRIVESC_BANK_IDOR_VIP_ACC}',
        vulnerability:
          'Horizontal Privilege Escalation via Parameter Tampering',
        fix:
          'Always verify account ownership: ' +
          'WHERE accountNo = ? AND userId = authenticatedUserId',
      };
    }

    return {
      success: true,
      exploited: false,
      accountNo,
      transactions: accountTransactions.map((t) => ({
        ...(t.meta as any),
        timestamp: t.createdAt,
      })),
    };
  }
}
