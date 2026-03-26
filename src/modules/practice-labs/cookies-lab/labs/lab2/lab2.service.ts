// src/modules/practice-labs/cookies-lab/labs/lab2/lab2.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

// ─────────────────────────────────────────────────────────────────────────────
// Lab 2 — Base64 UserId Cookie Bypass
// Vulnerability : userId stored as Base64 with no signing — trivially forgeable.
// Attack flow   : login (id=9, OQ==) → decode → change to 1 → encode → MQ== → /admin
// ─────────────────────────────────────────────────────────────────────────────
@Injectable()
export class Lab2Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  // ── Init ─────────────────────────────────────────────────────────────────
  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  // ❌ Vuln: userId is Base64-encoded (NOT encrypted) — anyone can decode & change it.
  async login(userId: string, labId: string, email: string, password: string) {
    if (!email || !password)
      throw new BadRequestException('email and password are required');

    if (email !== 'user@lab.com' || password !== 'password123')
      throw new UnauthorizedException('Invalid credentials');

    const rawId  = '9';                                              // support account
    const b64Id  = Buffer.from(rawId).toString('base64');           // "OQ=="

    return {
      success: true,
      user: { email, userId: 9, role: 'support' },
      cookie: {
        name: 'userId',
        value: b64Id,          // "OQ=="
        decoded: rawId,        // "9"  — sent to frontend for display
        instructions:
          `Your userId is Base64-encoded: "${b64Id}" → decoded: "${rawId}". ` +
          'Base64 is NOT encryption — anyone can reverse it. ' +
          'Figure out the admin\'s ID, encode it in Base64, and submit it.',
      },
    };
  }

  // ── Admin Panel ───────────────────────────────────────────────────────────
  // ❌ Vuln: decodes Base64 userId from x-session header, checks numeric value —
  //          no signature, no server-side session → trivially forgeable.
  async adminPanel(userId: string, labId: string, sessionCookie?: string) {
    if (!sessionCookie)
      throw new UnauthorizedException('No session cookie. Login first.');

    let decodedId: string;
    try {
      decodedId = Buffer.from(sessionCookie.trim(), 'base64').toString('utf8');
    } catch {
      throw new UnauthorizedException('Invalid Base64 value.');
    }

    // Validate it looks like a number
    if (!/^\d+$/.test(decodedId.trim())) {
      return {
        success: false,
        error: 'Invalid userId format — must be a number encoded in Base64.',
        yourUserId: sessionCookie.trim(),
        decodedUserId: decodedId,
        exploited: false,
        hint: 'Make sure you are sending a Base64-encoded number, e.g. btoa("1") = "MQ==".',
      };
    }

    if (decodedId.trim() !== '1') {
      return {
        success: false,
        error: 'Access Denied — you are not the admin.',
        yourUserId: sessionCookie.trim(),
        decodedUserId: decodedId.trim(),
        exploited: false,
        hint:
          decodedId.trim() === '9'
            ? 'Correct! You decoded your ID (9 = support). Admin always has ID = 1. Encode "1" → btoa("1") = "MQ==".'
            : 'Keep trying — admin\'s ID is a small number. Try encoding 1, 2, 3…',
      };
    }

    return {
      success: true,
      exploited: true,
      decodedUserId: '1',
      message: 'Welcome, Admin! You successfully bypassed the Base64 userId cookie.',
      flag: 'FLAG{BASE64_IS_NOT_ENCRYPTION}',
      vulnerability: 'Insecure Cookie — userId stored as unsigned Base64',
      explanation:
        'Base64 is a reversible encoding, not encryption. ' +
        'The server decoded the cookie value and used it as the user identity without verifying its integrity. ' +
        'An attacker decoded "OQ==" → "9", changed it to "1", re-encoded to "MQ==", and gained admin access. ' +
        'Fix: sign the cookie with HMAC (e.g. cookie-parser secret) or use opaque server-side session IDs.',
    };
  }
}
