import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab3Service {
  private stock = new Map<string, number>(); // labId -> stock count

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    this.stock.set(labId, 3); // Initial stock
    return this.stateService.initializeState(userId, labId);
  }

  async getStock(labId: string) {
    return { stock: this.stock.get(labId) || 0 };
  }

  // ❌ الثغرة: Race Condition في فحص المخزون
  async purchaseItem(userId: string, labId: string) {
    const currentStock = this.stock.get(labId) || 0;

    // Step 1: فحص المخزون
    if (currentStock <= 0) {
      throw new BadRequestException('Out of stock');
    }

    // ❌ الثغرة: فترة زمنية بين Check والـ Update
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Step 2: تحديث المخزون
    this.stock.set(labId, currentStock - 1);

    // تسجيل الشراء
    await this.prisma.labGenericLog.create({
      data: { userId, labId, type: 'PURCHASE' },
    });

    // عد المشتريات
    const purchases = await this.prisma.labGenericLog.count({
      where: { userId, labId, type: 'PURCHASE' },
    });

    if (purchases >= 10) {
      return {
        success: true,
        message: 'Item purchased',
        totalPurchases: purchases,
        flag: 'FLAG{RACE_CONDITION_STOCK_BYPASS}',
        exploited: true,
      };
    }

    return {
      success: true,
      message: 'Item purchased',
      totalPurchases: purchases,
    };
  }
}
