// src/modules/practice-labs/bl-vuln/labs/lab1/lab1.service.ts
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

  async getProducts(userId: string, labId: string) {
    const products = await this.prisma.labGenericContent.findMany({
      where: { userId, labId, author: 'store' },
    });

    return {
      success: true,
      products: products.map((p) => {
        const data = JSON.parse(p.body);
        return { productId: p.title, ...data };
      }),
    };
  }

  // ❌ الثغرة: يثق في price القادم من client
  async checkout(
    userId: string,
    labId: string,
    productId: string,
    quantity: number,
    price: number,
  ) {
    if (!productId) throw new BadRequestException('productId is required');
    if (quantity === undefined)
      throw new BadRequestException('quantity is required');
    if (price === undefined) throw new BadRequestException('price is required');

    const product = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, title: productId },
    });

    if (!product) throw new NotFoundException('Product not found');

    const productData = JSON.parse(product.body);

    // ❌ الثغرة: يستخدم price من الـ request body بدلاً من DB
    const total = price * quantity;

    // تسجيل الطلب
    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'ORDER',
        action: 'CHECKOUT',
        meta: {
          productId,
          quantity,
          clientPrice: price,
          realPrice: productData.realPrice,
          total,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // تحقق من الاستغلال
    const isExploited =
      price < productData.realPrice && productData.realPrice >= 100;

    if (isExploited) {
      return {
        success: true,
        exploited: true,
        receipt: {
          productName: productData.name,
          quantity,
          unitPrice: price,
          total,
          status: 'PAID',
        },
        flag: 'FLAG{BL_PRICE_MANIPULATION_CLIENT_TRUST_PWNED}',
        vulnerability: 'Business Logic — Client-Side Price Trust',
        impact:
          `You purchased "${productData.name}" (real price: $${productData.realPrice}) for $${total}. ` +
          'In a real store, this would result in direct financial loss.',
        fix:
          'Never trust client-supplied prices. Always fetch the price from the database: ' +
          'const total = product.realPrice * quantity;',
      };
    }

    return {
      success: true,
      exploited: false,
      receipt: {
        productName: productData.name,
        quantity,
        unitPrice: price,
        total,
        status: 'PAID',
      },
    };
  }
}
