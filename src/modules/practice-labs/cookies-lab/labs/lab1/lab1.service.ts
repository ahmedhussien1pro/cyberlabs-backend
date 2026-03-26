// src/modules/practice-labs/cookies-lab/labs/lab1/lab1.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

// ─────────────────────────────────────────────────────────────────────────────
// Lab 1 — Cookie Role Manipulation (Plain Text)
// Vulnerability : Server trusts a plain-text "role" cookie with no signing.
// Attack flow   : login → receive role=user cookie → change value to "admin" → access /admin
// ─────────────────────────────────────────────────────────────────────────────
@Injectable()
export class Lab1Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  // ── Init ─────────────────────────────────────────────────────────────────
  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  // ❌ Vuln: server returns the role as a plain-text cookie value.
  //          The client stores it and sends it back — no integrity check.
  async login(userId: string, labId: string, email: string, password: string) {
    if (!email || !password)
      throw new BadRequestException('email and password are required');

    if (email !== 'user@lab.com' || password !== 'password123')
      throw new UnauthorizedException('Invalid credentials');

    return {
      success: true,
      user: { email, role: 'user' },
      cookie: {
        name: 'role',
        value: 'user',
        instructions:
          'You received a cookie named "role" with value "user". ' +
          'Open DevTools → Application → Cookies and change the value to "admin", ' +
          'then copy the new value and submit it in the Attack panel.',
      },
    };
  }

  // ── Admin Panel ───────────────────────────────────────────────────────────
  // ❌ Vuln: reads role directly from x-session header (the cookie value)
  //          without any cryptographic verification.
  async adminPanel(userId: string, labId: string, sessionCookie?: string) {
    if (!sessionCookie)
      throw new UnauthorizedException('No session cookie. Login first.');

    const role = sessionCookie.trim();

    if (role !== 'admin') {
      return {
        success: false,
        error: 'Access Denied — wrong role',
        yourRole: role,
        exploited: false,
        hint:
          role === 'user'
            ? 'You are logged in as "user". Simply change the cookie value from "user" to "admin".'
            : 'The cookie value must be exactly "admin" (case-sensitive).',
      };
    }

    return {
      success: true,
      exploited: true,
      yourRole: 'admin',
      message: 'Welcome to the Admin Panel! You have successfully escalated your privileges.',
      flag: 'FLAG{COOKIE_ROLE_MANIPULATION_SUCCESS}',
      vulnerability: 'Insecure Cookie — Role stored client-side as plain text',
      explanation:
        'The server stored the user role in a plain-text cookie without any HMAC signature. ' +
        'Anyone with DevTools can change "user" to "admin" and gain full admin access. ' +
        'Fix: never store authorization data in unsigned cookies — ' +
        'use signed cookies (e.g. cookie-parser secret) or server-side sessions.',
    };
  }
}
