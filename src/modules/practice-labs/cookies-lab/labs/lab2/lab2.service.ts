// src/modules/practice-labs/cookies-lab/labs/lab2/lab2.service.ts
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab2Service {
  // ❌ الثغرة: weak secret يمكن brute force-ه
  private readonly WEAK_SECRET = 'abc123';

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async login(userId: string, labId: string, username: string) {
    if (!username) throw new BadRequestException('username is required');

    const payload = JSON.stringify({ username, role: 'user' });
    const payloadB64 = Buffer.from(payload).toString('base64');
    const sig = createHmac('sha256', this.WEAK_SECRET)
      .update(payloadB64)
      .digest('hex')
      .slice(0, 8); // ❌ truncated signature

    const cookie = `${payloadB64}.${sig}`;

    return {
      success: true,
      cookie,
      instructions:
        'Use this as your session cookie. The cookie format is: base64(payload).signature. ' +
        'Try to forge an admin cookie. The HMAC secret is weak and the signature is truncated.',
    };
  }

  async adminPanel(userId: string, labId: string, cookie: string) {
    if (!cookie) throw new UnauthorizedException('No cookie provided');

    const [payloadB64, sig] = cookie.split('.');
    if (!payloadB64 || !sig) throw new UnauthorizedException('Invalid cookie format');

    const expectedSig = createHmac('sha256', this.WEAK_SECRET)
      .update(payloadB64)
      .digest('hex')
      .slice(0, 8);

    if (sig !== expectedSig) {
      throw new UnauthorizedException({
        error: 'Invalid signature',
        hint: 'The secret is weak. Try common passwords to forge a valid signature.',
      });
    }

    let payload: { username: string; role: string };
    try {
      payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    } catch {
      throw new UnauthorizedException('Invalid payload');
    }

    if (payload.role !== 'admin') {
      return {
        success: false,
        yourRole: payload.role,
        hint: 'Valid signature, but you need role=admin in the payload.',
      };
    }

    return {
      success: true,
      exploited: true,
      flag: 'FLAG{HMAC_WEAK_SECRET_COOKIE_FORGERY}',
      vulnerability: 'Weak HMAC secret + truncated signature allows cookie forgery',
      explanation:
        'The HMAC secret "abc123" is trivially guessable. ' +
        'Additionally, truncating the signature to 8 hex chars reduces entropy from 256 to 32 bits. ' +
        'Fix: Use a cryptographically random secret of at least 32 bytes.',
    };
  }
}
