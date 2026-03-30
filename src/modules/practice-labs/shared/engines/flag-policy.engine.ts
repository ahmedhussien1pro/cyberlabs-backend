// ─────────────────────────────────────────────────────────────────────────────
// FlagPolicyEngine
// ─────────────────────────────────────────────────────────────────────────────
// Generates & verifies per-user dynamic flags using HMAC-SHA256.
// No DB schema change required — works with existing FlagRecordService.
//
// Usage (in any lab service):
//   const flag = FlagPolicyEngine.generate(userId, labId, LAB_SECRET);
//   await this.flagRecord.generateAndStore(userId, labId, attemptId, flag);
//
// Flag format:  FLAG{<PREFIX>_<8-char HMAC truncation>}
// Example:      FLAG{XSS_LAB1_a3f9c12b}
// ─────────────────────────────────────────────────────────────────────────────

import * as crypto from 'crypto';

export class FlagPolicyEngine {
  /**
   * Generate a deterministic per-user flag.
   * Same user + same lab + same secret always produces the same flag
   * (idempotent across resets within the same attempt).
   *
   * @param userId    Authenticated user's UUID
   * @param labId     Lab identifier string  (e.g. 'xss-lab1')
   * @param secret    Per-lab secret string  — never exposed to the client
   * @param prefix    Flag prefix            (e.g. 'XSS_LAB1')
   */
  static generate(
    userId: string,
    labId: string,
    secret: string,
    prefix: string,
  ): string {
    const hmac = crypto
      .createHmac('sha256', secret)
      .update(`${userId}:${labId}`)
      .digest('hex')
      .slice(0, 16); // 16 hex chars = 64-bit uniqueness

    return `FLAG{${prefix}_${hmac}}`;
  }

  /**
   * Verify a submitted flag without DB lookup.
   * Use when you want a fast inline check before calling FlagRecordService.
   */
  static verify(
    submitted: string,
    userId: string,
    labId: string,
    secret: string,
    prefix: string,
  ): boolean {
    const expected = FlagPolicyEngine.generate(userId, labId, secret, prefix);
    return submitted.trim() === expected;
  }
}
