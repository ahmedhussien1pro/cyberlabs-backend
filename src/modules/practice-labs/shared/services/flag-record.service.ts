// src/modules/practice-labs/shared/services/flag-record.service.ts
//
// Server-side flag registry.
// All flags are stored as SHA-256 hashes — NEVER plaintext.
//
// Lifecycle:
//   1. generateAndStore()  — called on lab launch, creates the record
//   2. verifyAndConsume()  — called on submitFlag, marks used=true
//   3. Reuse rejected      — used=true means no second reward

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database';
import * as crypto from 'crypto';

@Injectable()
export class FlagRecordService {
  constructor(private readonly prisma: PrismaService) {}

  private hash(flag: string): string {
    return crypto.createHash('sha256').update(flag.trim()).digest('hex');
  }

  /**
   * Resolve a labId (UUID or slug) → real UUID from DB.
   * Throws NotFoundException if not found.
   */
  private async resolveLabId(labIdOrSlug: string): Promise<string> {
    // try by id first (already a UUID)
    let lab = await this.prisma.lab.findUnique({
      where: { id: labIdOrSlug },
      select: { id: true },
    });
    if (!lab) {
      lab = await this.prisma.lab.findUnique({
        where: { slug: labIdOrSlug },
        select: { id: true },
      });
    }
    if (!lab) throw new NotFoundException(`Lab not found: ${labIdOrSlug}`);
    return lab.id;
  }

  /**
   * Store a flag hash for a specific user/lab/attempt.
   * Safe to call multiple times (upsert — no duplicate).
   * Accepts labId as UUID OR slug.
   *
   * @param ttlHours  How long the flag stays valid (default 24h)
   */
  async generateAndStore(
    userId: string,
    labIdOrSlug: string,
    attemptId: string,
    flag: string,
    ttlHours = 24,
  ): Promise<void> {
    const labId    = await this.resolveLabId(labIdOrSlug);
    const flagHash = this.hash(flag);
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    await this.prisma.labFlagRecord.upsert({
      where: { userId_labId_attemptId: { userId, labId, attemptId } },
      update: { flagHash, expiresAt, used: false, usedAt: null },
      create: { userId, labId, attemptId, flagHash, expiresAt },
    });
  }

  /**
   * Verify a submitted flag and consume it (single-use).
   * Accepts labId as UUID OR slug.
   *
   * @returns 'correct' | 'already_used' | 'expired' | 'wrong'
   */
  async verifyAndConsume(
    userId: string,
    labIdOrSlug: string,
    attemptId: string,
    submittedFlag: string,
  ): Promise<'correct' | 'already_used' | 'expired' | 'wrong'> {
    const labId = await this.resolveLabId(labIdOrSlug);

    const record = await this.prisma.labFlagRecord.findUnique({
      where: { userId_labId_attemptId: { userId, labId, attemptId } },
    });

    if (!record) return 'wrong';
    if (record.used) return 'already_used';
    if (record.expiresAt < new Date()) return 'expired';

    const submittedHash = this.hash(submittedFlag);
    if (submittedHash !== record.flagHash) return 'wrong';

    await this.prisma.labFlagRecord.update({
      where: { id: record.id },
      data: { used: true, usedAt: new Date() },
    });

    return 'correct';
  }

  /**
   * Lightweight check: does the user already have a valid unconsumed flag record?
   * Accepts labId as UUID OR slug.
   */
  async hasActiveRecord(
    userId: string,
    labIdOrSlug: string,
    attemptId: string,
  ): Promise<boolean> {
    const labId = await this.resolveLabId(labIdOrSlug);
    const record = await this.prisma.labFlagRecord.findUnique({
      where: { userId_labId_attemptId: { userId, labId, attemptId } },
    });
    return !!record && !record.used && record.expiresAt > new Date();
  }
}
