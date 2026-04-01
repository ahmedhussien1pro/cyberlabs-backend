/**
 * [9.1] Flag Submission Rate Limiter
 *
 * In-memory rate limiter — no Redis required.
 * Limit: MAX_ATTEMPTS attempts per WINDOW_MS per (userId + instanceId).
 *
 * Why in-memory:
 *   - Single-node deployments (current scale)
 *   - No additional infrastructure dependency
 *   - Upgrade path: swap Map for Redis INCR when horizontal scaling needed
 *
 * Security controls implemented:
 *   ✅ [9.1] Flag rate limit: 10 attempts / 60s per userId+instanceId
 *   ✅ [9.7] FLAG value never stored or returned — only HMAC hash used
 */

import { Injectable, Logger } from '@nestjs/common';

const MAX_ATTEMPTS = Number(process.env.FLAG_RATE_LIMIT_MAX ?? 10);
const WINDOW_MS    = Number(process.env.FLAG_RATE_LIMIT_WINDOW_MS ?? 60_000); // 60 seconds

interface Bucket {
  count:     number;
  resetAt:   number; // epoch ms
}

@Injectable()
export class VmLabsThrottler {
  private readonly logger = new Logger(VmLabsThrottler.name);
  private readonly buckets = new Map<string, Bucket>();

  /**
   * Returns true if the request is allowed, false if rate-limited.
   * Key is scoped to userId + instanceId so limits are per-attempt, not per-user.
   */
  allow(userId: string, instanceId: string): boolean {
    const key = `${userId}:${instanceId}`;
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      // First attempt or window expired — reset bucket
      bucket = { count: 1, resetAt: now + WINDOW_MS };
      this.buckets.set(key, bucket);
      return true;
    }

    bucket.count++;

    if (bucket.count > MAX_ATTEMPTS) {
      const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
      this.logger.warn(
        `Flag rate limit exceeded: userId=${userId} instanceId=${instanceId} ` +
        `attempts=${bucket.count} retryAfter=${retryAfterSec}s`,
      );
      return false;
    }

    return true;
  }

  /** Returns seconds until rate limit resets (0 if not limited). */
  retryAfterSeconds(userId: string, instanceId: string): number {
    const key = `${userId}:${instanceId}`;
    const bucket = this.buckets.get(key);
    if (!bucket || Date.now() >= bucket.resetAt) return 0;
    return Math.ceil((bucket.resetAt - Date.now()) / 1000);
  }

  /**
   * Cleanup stale buckets — called by VmCleanupCron daily job.
   * Prevents unbounded memory growth on long-running processes.
   */
  purgeExpired(): void {
    const now = Date.now();
    let purged = 0;
    for (const [key, bucket] of this.buckets.entries()) {
      if (now >= bucket.resetAt) {
        this.buckets.delete(key);
        purged++;
      }
    }
    if (purged > 0) {
      this.logger.debug(`VmLabsThrottler: purged ${purged} expired buckets`);
    }
  }
}
