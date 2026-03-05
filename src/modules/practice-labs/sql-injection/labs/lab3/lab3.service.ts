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

  // ❌ الثغرة: Blind Boolean SQLi in the promo code validator
  async validateCoupon(userId: string, labId: string, coupon: string) {
    // ❌ الثغرة: raw string interpolation — no parameterization
    const query = `
      SELECT id FROM "LabGenericContent"
      WHERE "userId" = '${userId}'
      AND   "labId"  = '${labId}'
      AND   title    = 'valid_coupon'
      AND   body     = '${coupon}'
    `;

    let isValid = false;
    try {
      const rows = (await this.prisma.$queryRawUnsafe(query)) as any[];
      isValid = rows.length > 0;
    } catch {
      // SQL errors are silently swallowed — only boolean behavior leaks information
      isValid = false;
    }

    // Pure binary response — no data, no error details, only true/false
    return {
      valid: isValid,
      message: isValid
        ? '✅ Coupon applied! You get 20% off your order.'
        : '❌ Invalid coupon code.',
    };
  }
}
