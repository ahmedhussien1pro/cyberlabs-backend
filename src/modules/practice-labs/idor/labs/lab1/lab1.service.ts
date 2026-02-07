import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import { LabValidationService } from '../../../shared/services/lab-validation.service';
import { Lab1Config } from './lab1.config';

@Injectable()
export class Lab1Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
    private validationService: LabValidationService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // جلب جميع الحسابات
  async getAllAccounts(userId: string, labId: string) {
    return this.prisma.labGenericBank.findMany({
      where: { userId, labId },
      select: {
        id: true,
        accountNo: true, // ✅ الاسم الصحيح
        balance: true,
      },
    });
  }

  // قراءة تفاصيل حساب معين (IDOR!)
  async getAccountDetails(userId: string, labId: string, accountNo: string) {
    const account = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId, accountNo }, // ✅ الاسم الصحيح
    });

    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  // تحويل الأموال (IDOR!)
  async transferMoney(
    userId: string,
    labId: string,
    fromAccount: string,
    toAccount: string,
    amount: number,
  ) {
    const source = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId, accountNo: fromAccount }, // ✅ الاسم الصحيح
    });

    const destination = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId, accountNo: toAccount }, // ✅ الاسم الصحيح
    });

    if (!source || !destination) {
      throw new BadRequestException('Invalid accounts');
    }

    if (source.balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    // تنفيذ التحويل
    await this.prisma.$transaction([
      this.prisma.labGenericBank.update({
        where: { id: source.id },
        data: { balance: { decrement: amount } },
      }),
      this.prisma.labGenericBank.update({
        where: { id: destination.id },
        data: { balance: { increment: amount } },
      }),
      // تسجيل العملية (بدون metadata لأنه مش موجود في Schema)
      this.prisma.labGenericLog.create({
        data: {
          userId,
          labId,
          type: 'PAYMENT',
          // ✅ نحذف metadata لو مش موجود في Schema
        },
      }),
    ]);

    // التحقق من الهدف - نفترض إن attacker account هو اللي balance بتاعه زاد
    const allAccounts = await this.prisma.labGenericBank.findMany({
      where: { userId, labId },
      orderBy: { balance: 'desc' },
    });

    const highestBalance = allAccounts[0]?.balance || 0;

    if (highestBalance >= 1000) {
      return {
        success: true,
        message: 'Transfer completed',
        flag: 'FLAG{IDOR_BANKING_EXPLOITED_2026}',
        exploited: true,
      };
    }

    return { success: true, message: 'Transfer completed', exploited: false };
  }
}
