import { Injectable, NotFoundException } from '@nestjs/common';
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

  // ❌ الثغرة: Parameter Tampering - يعتمد على accountNo من الـ request بدون authorization
  async getAccountBalance(userId: string, labId: string, accountNo: string) {
    const account = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId, accountNo },
    });

    if (!account) throw new NotFoundException('Account not found');

    // التحقق من الاستغلال
    if (accountNo === 'ACC-VIP' && account.balance >= 10000) {
      return {
        account,
        exploited: true,
        flag: 'FLAG{PARAMETER_TAMPERING_SUCCESS}',
        message: 'Parameter tampering successful! Accessed VIP account',
      };
    }

    return { account };
  }

  // ❌ الثغرة: يسمح بتحديث أي حساب بدون authorization
  async updateAccountBalance(
    userId: string,
    labId: string,
    accountNo: string,
    newBalance: number,
  ) {
    const account = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId, accountNo },
    });

    if (!account) throw new NotFoundException('Account not found');

    const updated = await this.prisma.labGenericBank.update({
      where: { id: account.id },
      data: { balance: newBalance },
    });

    return { success: true, account: updated };
  }

  // ❌ الثغرة: Mass Assignment - يقبل كل الـ fields من الـ request
  async createAccount(userId: string, labId: string, accountData: any) {
    // ❌ خطر: يقبل أي field بما فيها isVIP, creditLimit, etc
    const account = await this.prisma.labGenericBank.create({
      data: {
        userId,
        labId,
        accountNo: accountData.accountNo,
        balance: accountData.balance || 0,
        // أي fields إضافية في accountData يتم قبولها مباشرة!
      },
    });

    return { success: true, account };
  }
}
