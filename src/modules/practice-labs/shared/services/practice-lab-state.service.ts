import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database';
import * as crypto from 'crypto';

@Injectable()
export class PracticeLabStateService {
  constructor(private prisma: PrismaService) {}

  // ─── Dynamic Flag ────────────────────────────────────────────────────────────
  // كل مستخدم يحصل على flag فريد مبني على userId + labId + secret
  // مستحيل تعطيه لحد تاني لأن الباك يتحقق منه بنفس المعادلة
  generateDynamicFlag(prefix: string, userId: string, labId: string): string {
    const secret = process.env.FLAG_HMAC_SECRET ?? 'cyberlabs_flag_secret_2026';
    const token = crypto
      .createHmac('sha256', secret)
      .update(`${userId}:${labId}`)
      .digest('hex')
      .slice(0, 12)
      .toUpperCase();
    return `${prefix}_${token}`;
  }

  // ─── Verify Dynamic Flag ─────────────────────────────────────────────────────
  verifyDynamicFlag(
    prefix: string,
    userId: string,
    labId: string,
    submitted: string,
  ): boolean {
    return this.generateDynamicFlag(prefix, userId, labId) === submitted.trim();
  }

  // ─── Initialize Lab State ────────────────────────────────────────────────────
  async initializeState(userId: string, labId: string) {
    const lab = await this.prisma.lab.findUnique({
      where: { id: labId },
      select: { initialState: true, slug: true },
    });

    if (!lab) throw new NotFoundException('Lab configuration not found');

    const config = lab.initialState as any;

    // 1. تنظيف أي بيانات قديمة للمستخدم في هذا اللاب (Isolation)
    await this.prisma.$transaction([
      this.prisma.labGenericUser.deleteMany({ where: { userId, labId } }),
      this.prisma.labGenericBank.deleteMany({ where: { userId, labId } }),
      this.prisma.labGenericContent.deleteMany({ where: { userId, labId } }),
      this.prisma.labGenericLog.deleteMany({ where: { userId, labId } }),
    ]);

    // 2. استبدال أي placeholder بالـ dynamic flag الفعلي قبل الـ seed
    // مثال: "FLAG{SQLI_AUTH_BYPASS_SUCCESS}" → "FLAG{SQLI_AUTH_BYPASS_XXXXXXXXXXXX}"
    const dynamicFlag = this.generateDynamicFlag(
      this.resolveFlagPrefix(lab.slug),
      userId,
      labId,
    );
    const resolvedConfig = this.replaceFlagPlaceholder(config, dynamicFlag);

    // 3. إنشاء البيانات الجديدة بناءً على الـ Config
    if (resolvedConfig.users) {
      await this.prisma.labGenericUser.createMany({
        data: resolvedConfig.users.map((u: any) => ({ ...u, userId, labId })),
      });
    }

    if (resolvedConfig.banks) {
      await this.prisma.labGenericBank.createMany({
        data: resolvedConfig.banks.map((b: any) => ({ ...b, userId, labId })),
      });
    }

    if (resolvedConfig.contents) {
      await this.prisma.labGenericContent.createMany({
        data: resolvedConfig.contents.map((c: any) => ({
          ...c,
          userId,
          labId,
        })),
      });
    }

    return {
      status: 'success',
      message: 'Lab environment initialized',
      dynamicFlag, // ← يُرجع فقط لـ verify عند submit، مش يُعرض للمستخدم
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  // استبدال قيمة الـ FLAG في أي مكان داخل الـ config (recursive)
  private replaceFlagPlaceholder(obj: any, dynamicFlag: string): any {
    if (typeof obj === 'string') {
      return obj.startsWith('FLAG{') ? dynamicFlag : obj;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.replaceFlagPlaceholder(item, dynamicFlag));
    }
    if (obj && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [
          k,
          this.replaceFlagPlaceholder(v, dynamicFlag),
        ]),
      );
    }
    return obj;
  }

  // استخراج الـ prefix من الـ slug
  // مثال: 'sqli-auth-bypass' → 'FLAG{SQLI_AUTH_BYPASS'
  private resolveFlagPrefix(slug: string): string {
    const base = slug.toUpperCase().replace(/-/g, '_');
    return `FLAG{${base}`;
  }
}
