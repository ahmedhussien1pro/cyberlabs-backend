import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab2Service {
  private readonly ITEM_PRICE = 100;
  private appliedCoupons = new Map<string, string[]>(); // labKey -> coupon codes

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    this.appliedCoupons.clear();
    return this.stateService.initializeState(userId, labId);
  }

  // ❌ الثغرة: يسمح بتطبيق نفس الكوبون عدة مرات
  async applyCoupon(userId: string, labId: string, couponCode: string) {
    const key = `${userId}-${labId}`;
    const coupons = this.appliedCoupons.get(key) || [];

    // ❌ الثغرة: مافيش check للـ duplicates
    // المفروض يمنع استخدام نفس الكوبون أكتر من مرة
    coupons.push(couponCode);
    this.appliedCoupons.set(key, coupons);

    return {
      success: true,
      message: 'Coupon applied',
      totalCoupons: coupons.length,
    };
  }

  async calculatePrice(userId: string, labId: string) {
    const key = `${userId}-${labId}`;
    const coupons = this.appliedCoupons.get(key) || [];

    let price = this.ITEM_PRICE;

    // ❌ الثغرة: يطبق كل الكوبونات بدون validation
    // كل كوبون 20% خصم
    for (const coupon of coupons) {
      price = price * 0.8; // 20% discount
    }

    return {
      originalPrice: this.ITEM_PRICE,
      finalPrice: Math.max(0, price), // لا يسمح بالسالب بس zero ممكن
      couponsApplied: coupons.length,
      discount: this.ITEM_PRICE - price,
    };
  }

  // ❌ الثغرة: Checkout بدون validation proper
  async checkout(userId: string, labId: string) {
    const priceInfo = await this.calculatePrice(userId, labId);
    const wallet = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId, accountNo: 'WALLET' },
    });

    if (!wallet) throw new BadRequestException('Wallet not found');

    if (wallet.balance < priceInfo.finalPrice) {
      throw new BadRequestException('Insufficient balance');
    }

    // خصم المبلغ
    await this.prisma.labGenericBank.update({
      where: { id: wallet.id },
      data: { balance: { decrement: priceInfo.finalPrice } },
    });

    // التحقق من الاستغلال
    if (priceInfo.finalPrice <= 1 && priceInfo.couponsApplied > 3) {
      return {
        success: true,
        exploited: true,
        flag: 'FLAG{DISCOUNT_STACKING_EXPLOITED}',
        message: 'Discount stacking exploited! Item bought at near-zero price',
        priceInfo,
      };
    }

    return { success: true, priceInfo };
  }

  async reset(userId: string, labId: string) {
    const key = `${userId}-${labId}`;
    this.appliedCoupons.delete(key);
    return { success: true, message: 'Coupons reset' };
  }
}
