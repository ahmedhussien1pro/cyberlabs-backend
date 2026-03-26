// src/modules/practice-labs/cookies-lab/labs/lab7/lab7.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

// ─────────────────────────────────────────────────────────────────────────────
// Lab 7 — Predictable Session ID
// Vulnerability : Session IDs are generated using a sequential counter + a weak prefix.
//                 Attacker observes a few IDs and predicts the admin session ID.
// Attack flow   : Register → get sess_user_N → observe pattern →
//                 guess admin session (sess_admin_1) → access admin dashboard
// ─────────────────────────────────────────────────────────────────────────────

// Simulated weak session counter (sequential)
let sessionCounter = 100;

// The admin session that was generated with the same weak algorithm
// Admin logged in when counter was at 1 → sess_admin_1
const ADMIN_SESSION_ID = 'sess_admin_1';

@Injectable()
export class Lab7Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  // ❌ Vuln: session ID = prefix_role_counter (predictable sequential pattern)
  async login(userId: string, labId: string, email: string, password: string) {
    if (!email || !password)
      throw new BadRequestException('email and password are required');

    if (email !== 'user@lab.com' || password !== 'password123')
      throw new UnauthorizedException('Invalid credentials');

    const id = ++sessionCounter;
    const sessionId = `sess_user_${id}`;  // ❌ Predictable pattern

    return {
      success: true,
      user: { email, role: 'user' },
      sessionId,
      warning:
        '⚠️ Your session ID follows a predictable pattern: sess_user_<counter>. ' +
        'Can you figure out the pattern and predict the admin session ID?',
      tip: 'The admin was the very first user to log in. Their counter value was 1.',
    };
  }

  // ── Observe ───────────────────────────────────────────────────────────────
  // Returns several sequential session IDs so the attacker can see the pattern
  observeSessions(userId: string, labId: string) {
    const samples = [];
    const base = sessionCounter + 1;
    for (let i = 0; i < 5; i++) {
      samples.push(`sess_user_${base + i}`);
    }

    return {
      success: true,
      observedSessions: samples,
      analysis: {
        format: 'sess_<role>_<incrementing_number>',
        pattern: 'The counter increments by 1 for each new login.',
        observation:
          'Notice the sequential numbers. The server started its counter at 0. ' +
          'The very first login (the admin) would have gotten the first counter value.',
      },
      question:
        'Given the pattern "sess_admin_<N>", what would N be for the FIRST admin login?',
    };
  }

  // ── Predict Admin Session ─────────────────────────────────────────────────
  async predictAdminSession(
    userId: string,
    labId: string,
    predictedSessionId: string,
  ) {
    if (!predictedSessionId)
      throw new BadRequestException('predictedSessionId is required');

    if (predictedSessionId.trim() !== ADMIN_SESSION_ID) {
      return {
        success: false,
        error: 'Wrong session ID.',
        yourGuess: predictedSessionId,
        hint:
          'The pattern is sess_admin_<number>. ' +
          'The admin was the first to log in. What number would that be?',
      };
    }

    return {
      success: true,
      exploited: true,
      predictedSessionId,
      message: 'You predicted the admin session ID! Full admin access granted.',
      flag: 'FLAG{PREDICTABLE_SESSION_ID_EXPLOITED}',
      vulnerability: 'Weak session ID generation — sequential counter makes IDs predictable',
      explanation:
        'Session IDs must be generated using a cryptographically secure random number generator ' +
        'with at least 128 bits of entropy. Sequential counters, timestamps, or any predictable ' +
        'pattern allows attackers to enumerate valid sessions. ' +
        'Fix: use crypto.randomBytes(32) or equivalent to generate session IDs.',
    };
  }
}
