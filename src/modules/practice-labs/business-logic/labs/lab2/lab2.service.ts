// src/modules/practice-labs/bl-vuln/labs/lab2/lab2.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

// تعريف الكوبونات (in-memory للتبسيط)
const COUPONS = {
  SAVE20: { discount: 0.2, maxUses: 1 },
  WELCOME10: { discount: 0.1, maxUses: 1 },
};

@Injectable()
export class Lab2Service {
  // تتبع الطلبات المؤقتة (in-memory)
  private orders = new Map<
    string,
    {
      userId: string;
      labId: string;
      total: number;
      couponsApplied: string[];
      usedCoupons: Set<string>;
    }
  >();

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async createOrder(userId: string, labId: string, planId: string) {
    if (!planId) throw new BadRequestException('planId is required');

    const plan = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, title: planId },
    });

    if (!plan) throw new NotFoundException('Plan not found');

    const planData = JSON.parse(plan.body);
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    this.orders.set(orderId, {
      userId,
      labId,
      total: planData.price,
      couponsApplied: [],
      usedCoupons: new Set(),
    });

    return {
      success: true,
      orderId,
      plan: planData.name,
      originalPrice: planData.price,
      currentTotal: planData.price,
      note: 'Apply coupons to reduce the price. Available coupons: SAVE20, WELCOME10',
    };
  }

  // ❌ الثغرة: coupon reuse + stacking
  async applyCoupon(
    userId: string,
    labId: string,
    orderId: string,
    coupon: string,
  ) {
    if (!orderId || !coupon) {
      throw new BadRequestException('orderId and coupon are required');
    }

    const order = this.orders.get(orderId);
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    const couponData = COUPONS[coupon.toUpperCase()];
    if (!couponData) {
      throw new BadRequestException('Invalid coupon code');
    }

    // ❌ الثغرة 1: يتحقق من usedCoupons لكن يضيفها بعد حساب الخصم
    // ❌ الثغرة 2: لا يمنع تطبيق نفس الكوبون مرات متعددة بشكل صحيح
    if (order.usedCoupons.has(coupon.toUpperCase())) {
      // ❌ الثغرة: يرجع خطأ لكن بعض الـ race conditions تتجاوز هذا
      // في السيناريو الحقيقي: نسمح بالتجاوز للتعليم
    }

    // ❌ الثغرة 3: stacking — لا حد لعدد الكوبونات
    const discountAmount = order.total * couponData.discount;
    const newTotal = Math.max(0, order.total - discountAmount);

    // ❌ يضيف الكوبون بعد حساب الخصم (تأخر التسجيل)
    order.total = newTotal;
    order.couponsApplied.push(coupon.toUpperCase());
    // ❌ لا يُضاف للـ usedCoupons بشكل موثوق
    // order.usedCoupons.add(coupon.toUpperCase()); ← مُعلّق عمداً (الثغرة)

    return {
      success: true,
      couponApplied: coupon.toUpperCase(),
      discount: `${couponData.discount * 100}%`,
      discountAmount,
      newTotal,
      couponsApplied: order.couponsApplied,
      note:
        newTotal === 0
          ? '🎉 Total is now $0! Proceed to checkout.'
          : `Keep applying coupons! Current total: $${newTotal}`,
    };
  }

  async checkout(userId: string, labId: string, orderId: string) {
    if (!orderId) throw new BadRequestException('orderId is required');

    const order = this.orders.get(orderId);
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    const isExploited = order.total === 0 && order.couponsApplied.length > 2;

    // تسجيل
    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'ORDER',
        action: isExploited ? 'COUPON_ABUSE_DETECTED' : 'CHECKOUT',
        meta: {
          orderId,
          finalTotal: order.total,
          couponsApplied: order.couponsApplied,
          timestamp: new Date().toISOString(),
        },
      },
    });

    this.orders.delete(orderId);

    if (isExploited) {
      return {
        success: true,
        exploited: true,
        receipt: {
          orderId,
          finalTotal: order.total,
          couponsApplied: order.couponsApplied,
          status: 'PAID ($0)',
        },
        flag: 'FLAG{BL_COUPON_STACKING_UNLIMITED_DISCOUNT_ABUSE}',
        vulnerability: 'Business Logic — Coupon Abuse + Discount Stacking',
        impact:
          'You subscribed to the Elite Plan ($200/month) for free by abusing coupon logic.',
        fix:
          '1. Mark coupons as used BEFORE applying discount (atomic transaction)\n' +
          '2. Set maximum discount cap per order (e.g., max 30%)\n' +
          '3. Limit one coupon per order\n' +
          '4. Validate coupon server-side on every apply AND on checkout',
      };
    }

    return {
      success: true,
      exploited: false,
      receipt: {
        orderId,
        finalTotal: order.total,
        couponsApplied: order.couponsApplied,
        status: 'PAID',
      },
    };
  }
}
