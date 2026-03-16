// src/modules/practice-labs/cookies-lab/labs/lab1/lab1.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab1Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // تسجيل الدخول — يرجع role في الـ response body (الثغرة: المفروض يكون في httpOnly cookie)
  async login(userId: string, labId: string, email: string, password: string) {
    if (!email || !password)
      throw new BadRequestException('email and password are required');

    // ❌ الثغرة: credentials مكتوبة بشكل ثابت
    const validEmail = 'support@cyberlabs.tech';
    const validPassword = 'support123';

    if (email !== validEmail || password !== validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      success: true,
      message: 'Login successful',
      // ❌ الثغرة: role بيتبعت في الـ response — يقدر يتعدّل من الـ cookie
      user: { email, role: 'support' },
      cookie: {
        name: 'session',
        // ❌ value غير مشفرة — role قابلة للتعديل
        value: Buffer.from(JSON.stringify({ email, role: 'support' })).toString('base64'),
        instructions:
          'Set this as a cookie named "session" in your browser. Then try to access /admin.',
      },
    };
  }

  // ❌ الثغرة: يقرأ الـ role من الـ cookie بدون تحقق من integrity
  async adminPanel(userId: string, labId: string, sessionCookie?: string) {
    if (!sessionCookie) {
      throw new UnauthorizedException('No session cookie found. Login first.');
    }

    let session: { email: string; role: string };
    try {
      session = JSON.parse(Buffer.from(sessionCookie, 'base64').toString());
    } catch {
      throw new UnauthorizedException('Invalid session cookie format.');
    }

    if (!session.role) {
      throw new UnauthorizedException('Role not found in session.');
    }

    if (session.role !== 'admin') {
      return {
        success: false,
        error: 'Access Denied',
        yourRole: session.role,
        hint: 'You need admin role to access this panel. Can you modify your session cookie?',
      };
    }

    return {
      success: true,
      exploited: true,
      message: 'Welcome to the Admin Panel!',
      flag: 'FLAG{COOKIE_ROLE_MANIPULATION_SUCCESS}',
      vulnerability: 'Insecure Cookie — Role stored client-side without signing',
      explanation:
        'The server stored the user role in a Base64-encoded cookie without any HMAC signature. ' +
        'This allows any user to decode the cookie, change the role to "admin", and re-encode it. ' +
        'Fix: Use signed cookies (e.g., cookie-parser with secret) or store sessions server-side.',
    };
  }
}
