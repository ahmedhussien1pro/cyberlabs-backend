// src/modules/practice-labs/cookies-lab/labs/lab6/lab6.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

// ─────────────────────────────────────────────────────────────────────────────
// Lab 6 — Insecure Cookie Flags
// Vulnerability : Session cookie is set WITHOUT Secure, HttpOnly, and SameSite flags.
// Attack flow   : Login → inspect cookie flags → identify missing ones →
//                 apply correct configuration to get the flag
// ─────────────────────────────────────────────────────────────────────────────

// The insecure cookie configuration the vulnerable app uses
const INSECURE_COOKIE = {
  name: 'session_id',
  value: 'sess_7a2b9c4d',
  secure: false,      // ❌ Missing
  httpOnly: false,    // ❌ Missing
  sameSite: 'None',  // ❌ Wrong (should be Strict or Lax)
  path: '/',
};

const MISSING_FLAGS = ['Secure', 'HttpOnly', 'SameSite'];

@Injectable()
export class Lab6Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  async login(userId: string, labId: string, email: string, password: string) {
    if (!email || !password)
      throw new BadRequestException('email and password are required');

    if (email !== 'user@lab.com' || password !== 'password123')
      throw new UnauthorizedException('Invalid credentials');

    return {
      success: true,
      user: { email, role: 'user' },
      cookie: INSECURE_COOKIE,
      task: [
        'Inspect the cookie attributes above.',
        'Identify which security flags are MISSING or INCORRECT.',
        'Use the Audit panel to submit the list of missing flags.',
        'Then use the Fix panel to apply the correct configuration.',
      ],
    };
  }

  // ── Audit ─────────────────────────────────────────────────────────────────
  auditCookieFlags(userId: string, labId: string, missingFlags: string[]) {
    if (!missingFlags || !Array.isArray(missingFlags))
      throw new BadRequestException('missingFlags must be an array');

    const normalized = missingFlags.map((f) => f.trim());
    const correctlyIdentified = MISSING_FLAGS.filter((f) =>
      normalized.some((n) => n.toLowerCase() === f.toLowerCase()),
    );
    const missed = MISSING_FLAGS.filter(
      (f) => !normalized.some((n) => n.toLowerCase() === f.toLowerCase()),
    );
    const wrong = normalized.filter(
      (n) => !MISSING_FLAGS.some((f) => f.toLowerCase() === n.toLowerCase()),
    );

    const allCorrect = correctlyIdentified.length === MISSING_FLAGS.length && wrong.length === 0;

    return {
      success: allCorrect,
      correctlyIdentified,
      missed,
      wrongFlags: wrong,
      score: `${correctlyIdentified.length}/${MISSING_FLAGS.length}`,
      message: allCorrect
        ? '✅ Correct! Now use the Fix panel to apply the secure configuration.'
        : `❌ Not quite. You identified ${correctlyIdentified.length}/${MISSING_FLAGS.length} missing flags.`,
      hint: missed.length > 0 ? `You missed: ${missed.join(', ')}` : undefined,
    };
  }

  // ── Fix ───────────────────────────────────────────────────────────────────
  applyCookieFix(
    userId: string,
    labId: string,
    secure: boolean,
    httpOnly: boolean,
    sameSite: string,
  ) {
    const issues: string[] = [];

    if (secure !== true)  issues.push('Secure must be true');
    if (httpOnly !== true) issues.push('HttpOnly must be true');
    if (!sameSite || !['strict', 'lax'].includes(sameSite.toLowerCase()))
      issues.push('SameSite must be "Strict" or "Lax"');

    if (issues.length > 0) {
      return {
        success: false,
        issues,
        hint: 'A secure session cookie needs: Secure=true, HttpOnly=true, SameSite=Strict or Lax.',
      };
    }

    return {
      success: true,
      exploited: true,
      message: 'Perfect! You correctly secured the session cookie.',
      secureCookieConfig: {
        name: 'session_id',
        secure: true,
        httpOnly: true,
        sameSite: sameSite,
        path: '/',
        note: 'This is the correct and secure configuration.',
      },
      flag: 'FLAG{INSECURE_COOKIE_FLAGS_IDENTIFIED_AND_FIXED}',
      vulnerability: 'Missing Secure, HttpOnly, and SameSite cookie flags',
      explanation:
        'Secure prevents transmission over HTTP. ' +
        'HttpOnly prevents JavaScript access (XSS protection). ' +
        'SameSite=Strict prevents CSRF attacks by blocking cross-site cookie sending.',
    };
  }
}
