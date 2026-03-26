// src/modules/practice-labs/cookies-lab/labs/lab3/lab3.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

// ─────────────────────────────────────────────────────────────────────────────
// Lab 3 — Session Fixation
// Attack flow:
//   1. POST /pre-auth  { sessionId: "ATTACK_ID" }  → server stores it (no auth required)
//   2. POST /login     { email, password, sessionId: "ATTACK_ID" } → authenticated, SAME ID kept
//   3. POST /admin     x-session: "ATTACK_ID"  → finds authenticated session → FLAG
// Credentials: victim@lab.com / victim123
// Flag       : FLAG{SESSION_FIXATION_EXPLOITED}
// ─────────────────────────────────────────────────────────────────────────────
@Injectable()
export class Lab3Service {
  // In-memory session store keyed by userId:labId:sessionId
  private sessions = new Map<
    string,
    { userId: string; email: string; authenticated: boolean }
  >();

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // ── Step 1: Pre-auth — plant a session ID ──────────────────────────────────
  // ❌ Vuln: accepts client-controlled sessionId BEFORE authentication
  async preAuth(userId: string, labId: string, sessionId: string) {
    if (!sessionId || sessionId.trim().length < 4)
      throw new BadRequestException('sessionId must be at least 4 characters.');

    const key = `${userId}:${labId}:${sessionId.trim()}`;
    this.sessions.set(key, { userId, email: '', authenticated: false });

    return {
      success: true,
      message: 'Session planted. Now login using this same sessionId.',
      sessionId: sessionId.trim(),
      hint: 'The server accepted your session ID before you authenticated. Login with the same sessionId to bind it to an authenticated user.',
    };
  }

  // ── Step 2: Login — authenticates but KEEPS the same session ID ─────────
  // ❌ Vuln: no session.regenerate() after successful login
  async login(
    userId: string,
    labId: string,
    email: string,
    password: string,
    sessionId: string,
  ) {
    if (!email || !password)
      throw new BadRequestException('email and password are required');
    if (!sessionId)
      throw new BadRequestException(
        'sessionId is required — use the same one you planted via /pre-auth.',
      );

    if (email !== 'victim@lab.com' || password !== 'victim123')
      throw new UnauthorizedException('Invalid credentials');

    const key = `${userId}:${labId}:${sessionId.trim()}`;
    if (!this.sessions.has(key))
      throw new UnauthorizedException(
        'Session ID not found. Call /pre-auth first with this sessionId.',
      );

    // ❌ Vuln: update auth state but keep the SAME attacker-controlled sessionId
    this.sessions.set(key, { userId, email, authenticated: true });

    return {
      success: true,
      message: 'Victim authenticated successfully.',
      sessionId: sessionId.trim(),
      warning:
        '⚠️ The server kept your pre-planted sessionId after login — session was NOT regenerated.',
      hint: 'Now use the same sessionId you planted to access /admin.',
    };
  }

  // ── Step 3: Admin — trusts x-session header as authenticated session ────
  // ❌ Vuln: no re-verification, attacker reuses their planted sessionId
  async adminPanel(userId: string, labId: string, sessionId?: string) {
    if (!sessionId)
      throw new UnauthorizedException(
        'No sessionId provided. Use x-session header.',
      );

    const key = `${userId}:${labId}:${sessionId.trim()}`;
    const session = this.sessions.get(key);

    if (!session) {
      return {
        success: false,
        exploited: false,
        error: 'Session not found.',
        hint: 'Plant a session via /pre-auth first, then login with the same sessionId.',
      };
    }

    if (!session.authenticated) {
      return {
        success: false,
        exploited: false,
        error: 'Session exists but is not authenticated yet.',
        sessionId: sessionId.trim(),
        hint: 'Your session is planted but not authenticated. Call /login with this sessionId first.',
      };
    }

    // Clean up after successful exploit
    this.sessions.delete(key);

    return {
      success: true,
      exploited: true,
      sessionId: sessionId.trim(),
      authenticatedAs: session.email,
      message: "You hijacked the victim's session without knowing their password!",
      flag: 'FLAG{SESSION_FIXATION_EXPLOITED}',
      vulnerability: 'Session Fixation — server did not regenerate session ID after login',
      explanation:
        'The server accepted a client-provided sessionId before authentication and kept it after login. ' +
        'An attacker who planted the sessionId gains full authenticated access. ' +
        'Fix: always call session.regenerate() immediately after a successful login.',
    };
  }
}
