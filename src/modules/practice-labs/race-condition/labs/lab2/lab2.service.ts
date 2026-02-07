import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab2Service {
  private usedCoupons = new Map<string, Set<string>>(); // labId -> Set of used coupons

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    this.usedCoupons.set(labId, new Set());
    return this.stateService.initializeState(userId, labId);
  }

  // ❌ الثغرة: Race Condition في فحص الكوبون
  async applyCoupon(userId: string, labId: string, couponCode: string) {
    const labKey = `${labId}-${userId}`;

    // Step 1: فحص هل الكوبون مستخدم
    if (this.usedCoupons.get(labId)?.has(couponCode)) {
      throw new BadRequestException('Coupon already used');
    }

    // ❌ الثغرة: فترة زمنية بين Check والـ Update
    // لو أرسل المستخدم طلبات متعددة، كلها هتمر من الـ check!

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Step 2: تطبيق الخصم
    const wallet = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId, accountNo: 'WALLET' },
    });

    if (!wallet) throw new BadRequestException('Wallet not found');

    await this.prisma.labGenericBank.update({
      where: { id: wallet.id },
      data: { balance: { increment: 50 } },
    });

    // Step 3: تسجيل الكوبون كمستخدم (بعد التطبيق!)
    this.usedCoupons.get(labId)?.add(couponCode);

    // تسجيل العملية
    await this.prisma.labGenericLog.create({
      data: { userId, labId, type: 'COUPON' },
    });

    // التحقق من الهدف
    const updatedWallet = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId, accountNo: 'WALLET' },
    });

    if (updatedWallet && updatedWallet.balance >= 200) {
      return {
        success: true,
        message: 'Coupon applied',
        balance: updatedWallet.balance,
        flag: 'FLAG{RACE_CONDITION_COUPON_REUSE}',
        exploited: true,
      };
    }

    return {
      success: true,
      message: 'Coupon applied',
      balance: updatedWallet?.balance,
    };
  }
}
