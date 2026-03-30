// ─────────────────────────────────────────────────────────────────────────────
// CsrfDetectorEngine
// ─────────────────────────────────────────────────────────────────────────────
// Centralised CSRF exploit-condition evaluation for all CSRF lab services.
// Each lab passes its own context; the engine decides if exploitation occurred.
// ─────────────────────────────────────────────────────────────────────────────

export type CsrfContext = {
  /** Origin header from the request (undefined = header absent) */
  origin?: string;
  /** Referer header from the request */
  referer?: string;
  /** The trusted domain for this lab (e.g. 'connecthub.io') */
  trustedDomain: string;
  /** Content-Type of the request (for JSON-API bypass checks) */
  contentType?: string;
};

export type CsrfExploitResult = {
  exploited: boolean;
  reason: string; // human-readable for logging & lab feedback
};

export class CsrfDetectorEngine {
  /**
   * Lab 1-style: no token, no origin validation.
   * Exploited when request comes from a cross-origin context.
   */
  static basicCrossOrigin(ctx: CsrfContext): CsrfExploitResult {
    const isCrossOrigin =
      !ctx.origin || !ctx.origin.includes(ctx.trustedDomain);

    return {
      exploited: isCrossOrigin,
      reason: isCrossOrigin
        ? `Cross-origin request from "${ctx.origin ?? 'no-origin'}" — no CSRF token present`
        : 'Same-origin request — not exploited',
    };
  }

  /**
   * Lab 2-style: JSON API that accepts form-encoded (Content-Type bypass).
   * Exploited when form-encoded OR cross-origin.
   */
  static jsonApiContentTypeBypass(ctx: CsrfContext): CsrfExploitResult {
    const isFormEncoded =
      !!ctx.contentType?.includes('application/x-www-form-urlencoded');
    const isCrossOrigin =
      !ctx.origin || !ctx.origin.includes(ctx.trustedDomain);

    const exploited = isFormEncoded || isCrossOrigin;
    return {
      exploited,
      reason: exploited
        ? `Content-Type bypass: formEncoded=${isFormEncoded}, crossOrigin=${isCrossOrigin}`
        : 'Request appears same-origin with correct Content-Type',
    };
  }

  /**
   * Lab 3-style: SameSite=Lax bypass via GET state-changing endpoint.
   * Exploited when origin is cross-site (top-level GET navigation).
   */
  static samesiteLaxBypassGet(ctx: CsrfContext): CsrfExploitResult {
    const isCrossOrigin =
      !ctx.origin || !ctx.origin.includes(ctx.trustedDomain);

    return {
      exploited: isCrossOrigin,
      reason: isCrossOrigin
        ? 'SameSite=Lax bypass: cross-site GET navigation sends cookies automatically'
        : 'Same-site navigation — Lax protection holds',
    };
  }

  /**
   * Lab 4-style: CORS wildcard subdomain misconfiguration.
   * Exploited when origin is a trusted subdomain but NOT the app itself.
   */
  static corsWildcardSubdomain(
    ctx: CsrfContext,
    appOrigin: string,
  ): CsrfExploitResult {
    const isTrustedSubdomain =
      !!ctx.origin?.endsWith(`.${ctx.trustedDomain}`) ||
      ctx.origin?.endsWith(ctx.trustedDomain);
    const isAppItself = ctx.origin === appOrigin;
    const exploited = isTrustedSubdomain && !isAppItself;

    return {
      exploited,
      reason: exploited
        ? `CORS wildcard subdomain attack from "${ctx.origin}" — trusted but not the app origin`
        : 'Request from app origin or untrusted domain',
    };
  }

  /**
   * Lab 5-style: Predictable CSRF token.
   * Exploited when a valid token was supplied for a DIFFERENT user's record.
   */
  static predictableToken(
    requestingUserId: string,
    targetUserId: string,
    tokenValid: boolean,
  ): CsrfExploitResult {
    const exploited = tokenValid && requestingUserId !== targetUserId;
    return {
      exploited,
      reason: exploited
        ? `Predictable token accepted for victim "${targetUserId}" — requested by "${requestingUserId}"`
        : tokenValid
          ? 'Token valid and user is the owner — legitimate update'
          : 'Token invalid',
    };
  }
}
