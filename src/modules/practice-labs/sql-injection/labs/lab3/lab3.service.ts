import { Injectable } from '@nestjs/common';
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

  async validateCoupon(userId: string, labId: string, coupon: string) {
    const query = `
      SELECT id FROM "LabGenericContent"
      WHERE  "userId" = '${userId}'
      AND    "labId"  = '${labId}'
      AND    title    = 'valid_coupon'
      AND    body     = '${coupon}'
    `;

    let isValid = false;
    try {
      const rows = (await this.prisma.$queryRawUnsafe(query)) as any[];
      isValid = rows.length > 0;
    } catch {
      isValid = false;
    }

    return {
      valid: isValid,
      message: isValid
        ? '✅ Coupon applied! You get 20% off your order.'
        : '❌ Invalid coupon code.',
    };
  }
}
