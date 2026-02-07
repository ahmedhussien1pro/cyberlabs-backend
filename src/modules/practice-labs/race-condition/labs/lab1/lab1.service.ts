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

  async getBalance(userId: string, labId: string, accountNo: string) {
    const account = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId, accountNo },
    });

    return account ? { accountNo, balance: account.balance } : null;
  }

  // ❌ الثغرة: Race Condition - No transaction locking!
  async transfer(
    userId: string,
    labId: string,
    from: string,
    to: string,
    amount: number,
  ) {
    // Step 1: قراءة الرصيد
    const sourceAccount = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId, accountNo: from },
    });

    if (!sourceAccount)
      throw new BadRequestException('Source account not found');

    // ❌ الثغرة: فترة زمنية بين Check والـ Update
    // لو أرسل المستخدم طلبات متعددة بسرعة، كلها هتشوف نفس الرصيد!
    if (sourceAccount.balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    // Step 2: تحديث الرصيد (بدون قفل!)
    await this.prisma.labGenericBank.update({
      where: { id: sourceAccount.id },
      data: { balance: { decrement: amount } },
    });

    const destAccount = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId, accountNo: to },
    });

    if (destAccount) {
      await this.prisma.labGenericBank.update({
        where: { id: destAccount.id },
        data: { balance: { increment: amount } },
      });
    }

    // تسجيل العملية
    await this.prisma.labGenericLog.create({
      data: { userId, labId, type: 'PAYMENT' },
    });

    // التحقق من الهدف
    const merchantAccount = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId, accountNo: 'MER001' },
    });

    if (merchantAccount && merchantAccount.balance >= 500) {
      return {
        success: true,
        message: 'Transfer completed',
        flag: 'FLAG{RACE_CONDITION_DOUBLE_SPENDING}',
        exploited: true,
      };
    }

    return { success: true, message: 'Transfer completed' };
  }
}
