// src/modules/practice-labs/cookies-lab/labs/lab5/lab5.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

// ─────────────────────────────────────────────────────────────────────────────
// Lab 5 — Session Fixation Attack
// Vulnerability : Server accepts a client-supplied session ID at login.
//                 The attacker sets a known session ID before the victim logs in,
//                 then uses that same ID to access the victim's authenticated session.
// Attack flow   : Attacker pre-sets sessionId=ATTACKER_KNOWN →
//                 victim logs in using that link → server binds auth to ATTACKER_KNOWN →
//                 attacker uses ATTACKER_KNOWN to access authenticated dashboard
// ─────────────────────────────────────────────────────────────────────────────

// In-memory session store (per userId for lab isolation)
const sessionStore = new Map<string, { email: string; role: string; sessionId: string }>();

@Injectable()
export class Lab5Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    // Clear any previous session for this user's lab instance
    sessionStore.delete(userId);
    return this.stateService.initializeState(userId, labId);
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  // ❌ Vuln: if presetSession is provided, the server USES it as the session ID
  //          instead of generating a fresh one after authentication.
  async login(
    userId: string,
    labId: string,
    email: string,
    password: string,
    presetSession?: string,
  ) {
    if (!email || !password)
      throw new BadRequestException('email and password are required');

    if (email !== 'victim@lab.com' || password !== 'victim123')
      throw new UnauthorizedException('Invalid credentials');

    // ❌ Vulnerability: reuse the attacker-supplied session ID instead of generating a new one
    const sessionId = presetSession?.trim() || `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    sessionStore.set(userId, { email, role: 'user', sessionId });

    return {
      success: true,
      user: { email, role: 'user' },
      sessionId,
      warning: presetSession
        ? '⚠️ Server reused the client-supplied session ID! This is the Session Fixation vulnerability.'
        : 'Server generated a fresh session ID (secure path).',
      hint: presetSession
        ? 'You fixed the session. Now use this same session ID to access the dashboard as the victim.'
        : undefined,
    };
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  async accessDashboard(userId: string, labId: string, sessionId: string) {
    if (!sessionId)
      throw new BadRequestException('sessionId is required');

    const session = sessionStore.get(userId);

    if (!session) {
      return {
        success: false,
        error: 'No active session found. The victim must login first.',
      };
    }

    if (session.sessionId !== sessionId.trim()) {
      return {
        success: false,
        error: 'Session ID mismatch.',
        hint: 'Use the exact session ID you pre-set before the victim logged in.',
      };
    }

    return {
      success: true,
      exploited: true,
      message: `You accessed the dashboard as ${session.email} using the fixed session ID!`,
      flag: 'FLAG{SESSION_FIXATION_ATTACK_SUCCESS}',
      vulnerability: 'Session Fixation — server accepted client-supplied session ID',
      explanation:
        'The server did not generate a new session ID after successful authentication. ' +
        'It reused the attacker-supplied ID, allowing the attacker to predict and use the session. ' +
        'Fix: always call session.regenerate() or equivalent after successful login.',
    };
  }
}
