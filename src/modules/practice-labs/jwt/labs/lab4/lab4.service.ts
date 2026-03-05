// src/modules/practice-labs/jwt/labs/lab4/lab4.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class Lab4Service {
  private readonly DEFAULT_SECRET = 'cloud_vault_key_2026';

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async login(userId: string, labId: string, username: string) {
    if (!username) {
      throw new BadRequestException('username is required');
    }

    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const token = jwt.sign(
      { username: user.username, role: user.role },
      this.DEFAULT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: '1h',
      },
    );

    const decoded = jwt.decode(token, { complete: true }) as any;
    const header = { ...decoded.header, kid: 'default-key-2026' };
    const payload = decoded.payload;

    // إعادة تشفير مع kid
    const headerEncoded = Buffer.from(JSON.stringify(header)).toString(
      'base64url',
    );
    const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    );
    const signature = token.split('.')[2];
    const tokenWithKid = `${headerEncoded}.${payloadEncoded}.${signature}`;

    return {
      success: true,
      token: tokenWithKid,
      user: { username: user.username, role: user.role },
      note: 'Notice the "kid" header in the JWT. This indicates which key the server should use for verification.',
    };
  }

  // ❌ الثغرة: يقرأ kid من header ويستخدمه في path بدون sanitization
  async getAdminUsers(userId: string, labId: string, authHeader?: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');

    let decoded: any;
    try {
      const decodedToken = jwt.decode(token, { complete: true });
      if (!decodedToken) {
        throw new UnauthorizedException('Invalid token format');
      }

      const kid = decodedToken.header.kid || 'default-key-2026';

      // ❌ الثغرة: path traversal في kid
      // محاكاة: لو kid = "../../../../dev/null" → key = empty string
      let verificationKey = this.DEFAULT_SECRET;

      if (
        kid.includes('..') ||
        kid.includes('/dev/null') ||
        kid === '../../../../dev/null'
      ) {
        // محاكاة قراءة /dev/null → empty file
        verificationKey = ''; // empty secret
      }

      decoded = jwt.verify(token, verificationKey, { algorithms: ['HS256'] });
    } catch (error) {
      throw new UnauthorizedException({
        error: 'Invalid or expired token',
        details: error.message,
        hint: 'Try injecting a "kid" header that points to a predictable file like /dev/null',
      });
    }

    if (decoded.role !== 'admin') {
      throw new UnauthorizedException({
        error: 'Access denied',
        message: 'Admin role required',
        yourRole: decoded.role,
      });
    }

    const allUsers = await this.prisma.labGenericUser.findMany({
      where: { userId, labId },
      select: { username: true, role: true, email: true },
    });

    const allContents = await this.prisma.labGenericContent.findMany({
      where: { userId, labId },
    });

    const decodedFull = jwt.decode(token, { complete: true }) as any;
    const kid = decodedFull?.header?.kid || '';
    const isExploited = kid.includes('dev/null') || kid.includes('..');

    if (isExploited) {
      return {
        success: true,
        exploited: true,
        users: allUsers,
        adminSecrets: allContents
          .filter((c) => c.author === 'sysadmin')
          .map((c) => {
            try {
              return JSON.parse(c.body);
            } catch {
              return { content: c.body };
            }
          }),
        flag: 'FLAG{JWT_KID_PATH_TRAVERSAL_ADMIN_PWNED}',
        vulnerability: 'JWT kid Header Injection + Path Traversal',
        kidUsed: kid,
        impact:
          'You exploited the kid parameter to perform path traversal, ' +
          'forcing the backend to use /dev/null (empty file) as the HMAC secret.',
        fix:
          'Sanitize the kid parameter: reject if it contains "..", "/", or non-alphanumeric chars. ' +
          'Use a whitelist of allowed key IDs.',
      };
    }

    return {
      success: true,
      exploited: false,
      users: allUsers,
    };
  }
}
