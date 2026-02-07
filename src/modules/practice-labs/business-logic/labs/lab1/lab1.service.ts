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

  async getBalance(userId: string, labId: string) {
    const wallet = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId, accountNo: 'WALLET' },
    });
    return { balance: wallet?.balance || 0 };
  }

  // ❌ الثغرة: Price Manipulation - يستقبل السعر من الـ client!
  async purchaseItem(
    userId: string,
    labId: string,
    itemName: string,
    price: number, // ❌ الثغرة: السعر يجي من الـ request!
    quantity: number = 1,
  ) {
    // التحقق من الـ wallet
    const wallet = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId, accountNo: 'WALLET' },
    });

    if (!wallet) throw new BadRequestException('Wallet not found');

    const totalCost = price * quantity; // ❌ يحسب بناءً على السعر من الـ client

    // ❌ الثغرة: لو المستخدم أرسل سعر سالب، هيزيد الرصيد!
    if (wallet.balance < totalCost) {
      throw new BadRequestException('Insufficient balance');
    }

    // خصم المبلغ
    await this.prisma.labGenericBank.update({
      where: { id: wallet.id },
      data: { balance: { decrement: totalCost } },
    });

    // تسجيل الشراء
    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'PURCHASE',
        meta: { item: itemName, price, quantity, total: totalCost },
      },
    });

    // التحقق من الاستغلال
    if (price <= 0 || price < 100) {
      // السعر الحقيقي 1000
      return {
        success: true,
        message: `Purchased ${itemName} for ${totalCost}$`,
        exploited: true,
        flag: 'FLAG{PRICE_MANIPULATION_EXPLOITED}',
        warning:
          'Price manipulation detected! Item bought at manipulated price',
      };
    }

    return {
      success: true,
      message: `Purchased ${itemName} for ${totalCost}$`,
    };
  }

  // ❌ الثغرة: Negative Quantity
  async refundItem(
    userId: string,
    labId: string,
    itemName: string,
    price: number,
    quantity: number, // ❌ لو أرسل negative quantity
  ) {
    const wallet = await this.prisma.labGenericBank.findFirst({
      where: { userId, labId, accountNo: 'WALLET' },
    });

    if (!wallet) throw new BadRequestException('Wallet not found');

    const refundAmount = price * quantity;

    // إضافة المبلغ المسترد
    await this.prisma.labGenericBank.update({
      where: { id: wallet.id },
      data: { balance: { increment: refundAmount } },
    });

    return {
      success: true,
      message: `Refunded ${refundAmount}$`,
    };
  }
}
