// src/modules/practice-labs/cookies-lab/labs/lab4/lab4.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

// ─────────────────────────────────────────────────────────────────────────────
// Lab 4 — XSS Cookie Theft (Missing HttpOnly Flag)
// Vulnerability : Session cookie is NOT HttpOnly → accessible via document.cookie
// Attack flow   : Login → observe cookie → inject XSS payload → steal cookie → use it
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_SESSION = 'sess_admin_9f3k2m8x';

@Injectable()
export class Lab4Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  // ❌ Vuln: returns session cookie WITHOUT HttpOnly flag instructions
  async login(userId: string, labId: string, email: string, password: string) {
    if (!email || !password)
      throw new BadRequestException('email and password are required');

    if (email === 'admin@lab.com' && password === 'adminpass') {
      return {
        success: true,
        user: { email, role: 'admin' },
        cookie: {
          name: 'session_id',
          value: ADMIN_SESSION,
          httpOnly: false, // ❌ Missing HttpOnly — intentional vulnerability
          secure: false,
          note: 'This cookie has NO HttpOnly flag. JavaScript can read it via document.cookie.',
        },
      };
    }

    if (email === 'user@lab.com' && password === 'password123') {
      return {
        success: true,
        user: { email, role: 'user' },
        cookie: {
          name: 'session_id',
          value: 'sess_user_2a7b1c',
          httpOnly: false, // ❌ Same vulnerability for user
          secure: false,
          note: 'Your session cookie is accessible via JavaScript. Try the XSS comment box.',
        },
      };
    }

    throw new UnauthorizedException('Invalid credentials');
  }

  // ── Comment (simulated XSS sink) ─────────────────────────────────────────
  // ❌ Vuln: input reflected back without sanitisation
  async postComment(userId: string, labId: string, comment: string) {
    if (!comment) throw new BadRequestException('comment is required');

    // Detect XSS payload targeting document.cookie
    const xssPatterns = [
      /document\.cookie/i,
      /fetch\s*\(/i,
      /<script/i,
      /onerror\s*=/i,
      /onload\s*=/i,
    ];
    const isXssAttempt = xssPatterns.some((p) => p.test(comment));

    if (isXssAttempt) {
      return {
        success: true,
        xssDetected: true,
        message: 'Your script ran in the victim browser!',
        simulatedResult:
          'The victim browser executed your payload. ' +
          'In a real attack, document.cookie would return the admin session: ' +
          ADMIN_SESSION,
        stolenCookie: ADMIN_SESSION,
        nextStep:
          'Copy the stolen cookie and submit it in the "Use Stolen Session" panel.',
      };
    }

    return {
      success: true,
      xssDetected: false,
      renderedComment: comment,
      hint: 'Your comment was posted. Try injecting a payload that reads document.cookie.',
    };
  }

  // ── Validate stolen cookie ─────────────────────────────────────────────────
  async validateStolenCookie(
    userId: string,
    labId: string,
    stolenCookie: string,
  ) {
    if (!stolenCookie)
      throw new BadRequestException('stolenCookie is required');

    if (stolenCookie.trim() !== ADMIN_SESSION) {
      return {
        success: false,
        error: 'Invalid session cookie.',
        hint: 'Use the exact cookie value returned by the XSS simulation.',
      };
    }

    return {
      success: true,
      exploited: true,
      message: 'Session hijacked! You are now authenticated as admin.',
      flag: 'FLAG{XSS_COOKIE_THEFT_HTTPONLY_MISSING}',
      vulnerability: 'Missing HttpOnly flag enables JavaScript cookie access',
      explanation:
        'Because the session cookie lacked the HttpOnly flag, ' +
        'any JavaScript running on the page (including XSS payloads) could read it. ' +
        'Fix: always set HttpOnly=true on session cookies so JS cannot access them.',
    };
  }
}
