// src/modules/practice-labs/bl-vuln/labs/lab4/lab4.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab4Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async getBalance(userId: string, labId: string) {
    const wallets = await this.prisma.labGenericBank.findMany({
      where: { userId, labId },
    });

    return {
      success: true,
      wallets: wallets.map((w) => ({
        accountNo: w.accountNo,
        balance: w.balance,
        owner: w.ownerName,
      })),
    };
  }

  // ❌ الثغرة: read-check-update بدون atomic transaction
  async transfer(
    userId: string,
    labId: string,
    toAccount: string,
    amount: number,
  ) {
    if (!toAccount || !amount) {
      throw new BadRequestException('toAccount and amount are required');
    }
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const senderWallet = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId, accountNo: 'VAULT-A' },
    });

    if (!senderWallet) throw new NotFoundException('Sender wallet not found');

    const receiverWallet = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId, accountNo: toAccount },
    });

    if (!receiverWallet)
      throw new NotFoundException('Receiver wallet not found');

    // ❌ الثغرة: يقرأ الرصيد، ثم يتحقق، ثم يحدّث بعمليتين منفصلتين
    // Race window: بين القراءة والكتابة
    if (senderWallet.balance < amount) {
      throw new BadRequestException({
        error: 'Insufficient funds',
        currentBalance: senderWallet.balance,
        requestedAmount: amount,
      });
    }

    // ❌ عمليتا UPDATE منفصلتان — بدون transaction lock
    await this.prisma.labGenericBank.update({
      where: { id: senderWallet.id },
      data: { balance: senderWallet.balance - amount }, // ❌ stale read
    });

    await this.prisma.labGenericBank.update({
      where: { id: receiverWallet.id },
      data: { balance: receiverWallet.balance + amount },
    });

    // تسجيل
    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'TRANSACTION',
        action: 'TRANSFER',
        meta: {
          from: 'VAULT-A',
          to: toAccount,
          amount,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // تحقق من الاستغلال
    const updatedReceiver = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId, accountNo: toAccount },
    });

    const isExploited = updatedReceiver && updatedReceiver.balance > 100;

    return {
      success: true,
      exploited: isExploited || false,
      transfer: { from: 'VAULT-A', to: toAccount, amount, status: 'SUCCESS' },
      newBalances: {
        senderBalance: senderWallet.balance - amount,
        receiverBalance: updatedReceiver?.balance,
      },
      ...(isExploited && {
        flag: 'FLAG{BL_RACE_CONDITION_DOUBLE_SPEND_CRYPTO_VAULT}',
        vulnerability: 'Business Logic — Race Condition (Double Spend)',
        impact:
          'You exploited a race condition to spend the same $100 twice, creating money out of thin air.',
        fix:
          '1. Use atomic database transactions with row-level locking\n' +
          '2. Use optimistic locking (version field): UPDATE wallet SET balance = balance - amount WHERE id = ? AND balance >= amount AND version = ?\n' +
          '3. Use Redis distributed locks for critical financial operations\n' +
          '4. Implement idempotency keys to prevent duplicate requests',
      }),
    };
  }
}
