// src/modules/practice-labs/idor/labs/lab1/lab1.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
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

  async getMyOrders(userId: string, labId: string) {
    // يعرض فقط ORD-1001 للمستخدم الحالي
    const myOrder = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, title: 'ORD-1001' },
    });

    return {
      success: true,
      orders: myOrder
        ? [{ orderId: myOrder.title, ...JSON.parse(myOrder.body) }]
        : [],
      note: 'This is your only order. Use /orders/track to get full tracking details.',
    };
  }

  // ❌ الثغرة: يجلب أي order بدون التحقق من ownership
  async trackOrder(userId: string, labId: string, orderId: string) {
    if (!orderId) throw new BadRequestException('orderId is required');

    const order = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, title: orderId },
    });

    if (!order) {
      return {
        success: false,
        error: 'Order not found',
        hint: 'Try other order IDs. Format: ORD-XXXX',
      };
    }

    let orderData: any = {};
    try {
      orderData = JSON.parse(order.body);
    } catch {
      orderData = { raw: order.body };
    }

    const isOwn = orderId === 'ORD-1001';
    const isVIP = order.author === 'vip_shipment';

    if (isVIP) {
      return {
        success: true,
        exploited: true,
        orderId,
        shipment: orderData,
        flag:
          orderData.flag ||
          'FLAG{IDOR_ORDER_TRACKING_SEQUENTIAL_ID_ENUMERATION}',
        vulnerability:
          'IDOR — Insecure Direct Object Reference (Sequential ID)',
        impact:
          'You accessed a TOP SECRET government shipment. In reality, this could expose classified cargo, recipient identities, and logistics of sensitive operations.',
        fix: 'Add ownership check: WHERE id = orderId AND userId = authenticatedUserId',
      };
    }

    return {
      success: true,
      exploited: !isOwn,
      orderId,
      shipment: orderData,
      note: isOwn
        ? 'This is your own order.'
        : `⚠️ This order belongs to "${orderData.owner}", not you! Keep enumerating to find the VIP shipment.`,
    };
  }
}
