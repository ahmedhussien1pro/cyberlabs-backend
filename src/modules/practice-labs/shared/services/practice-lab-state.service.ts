// src/modules/practice-labs/shared/services/practice-lab-state.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database';
import * as crypto from 'crypto';

@Injectable()
export class PracticeLabStateService {
  constructor(private prisma: PrismaService) {}

  // ─── Dynamic Flag ────────────────────────────────────────────────────────────
  generateDynamicFlag(prefix: string, userId: string, labId: string): string {
    const secret = process.env.FLAG_HMAC_SECRET ?? 'cyberlabs_flag_secret_2026';
    const token = crypto
      .createHmac('sha256', secret)
      .update(`${userId}:${labId}`)
      .digest('hex')
      .slice(0, 12)
      .toUpperCase();
    // ✅ closing } — FLAG{PREFIX_TOKEN}
    return `${prefix}_${token}}`;
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

  // ─── Resolve Lab (by id OR slug) ─────────────────────────────────────────────
  private async resolveLab(labId: string) {
    let lab = await this.prisma.lab.findUnique({
      where: { id: labId },
      select: { id: true, initialState: true, slug: true },
    });

    if (!lab) {
      lab = await this.prisma.lab.findUnique({
        where: { slug: labId },
        select: { id: true, initialState: true, slug: true },
      });
    }

    return lab;
  }

  // ─── Initialize Lab State ────────────────────────────────────────────────────
  async initializeState(userId: string, labId: string) {
    const lab = await this.resolveLab(labId);

    if (!lab) throw new NotFoundException('Lab configuration not found');

    const resolvedLabId = lab.id;
    const config = lab.initialState as any;

    await this.prisma.$transaction([
      this.prisma.labGenericUser.deleteMany({ where: { userId, labId: resolvedLabId } }),
      this.prisma.labGenericBank.deleteMany({ where: { userId, labId: resolvedLabId } }),
      this.prisma.labGenericContent.deleteMany({ where: { userId, labId: resolvedLabId } }),
      this.prisma.labGenericLog.deleteMany({ where: { userId, labId: resolvedLabId } }),
    ]);

    const dynamicFlag = this.generateDynamicFlag(
      this.resolveFlagPrefix(lab.slug),
      userId,
      resolvedLabId,
    );
    const resolvedConfig = this.replaceFlagPlaceholder(config, dynamicFlag);

    if (resolvedConfig?.users?.length) {
      await this.prisma.labGenericUser.createMany({
        data: resolvedConfig.users.map((u: any) => ({ ...u, userId, labId: resolvedLabId })),
      });
    }

    if (resolvedConfig?.banks?.length) {
      await this.prisma.labGenericBank.createMany({
        data: resolvedConfig.banks.map((b: any) => ({ ...b, userId, labId: resolvedLabId })),
      });
    }

    if (resolvedConfig?.contents?.length) {
      await this.prisma.labGenericContent.createMany({
        data: resolvedConfig.contents.map((c: any) => ({ ...c, userId, labId: resolvedLabId })),
      });
    }

    return {
      status: 'success',
      message: 'Lab environment initialized',
      labId: resolvedLabId,
      dynamicFlag,
    };
  }

  // ─── Get Resolved Lab ID ─────────────────────────────────────────────────────
  async resolveLabId(labIdOrSlug: string): Promise<string> {
    const lab = await this.resolveLab(labIdOrSlug);
    if (!lab) throw new NotFoundException('Lab configuration not found');
    return lab.id;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
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

  private resolveFlagPrefix(slug: string): string {
    const base = slug.toUpperCase().replace(/-/g, '_');
    return `FLAG{${base}`;
  }
}
