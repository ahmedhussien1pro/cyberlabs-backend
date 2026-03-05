// src/modules/practice-labs/jwt/labs/lab3/lab3.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

@Injectable()
export class Lab3Service {
  // RSA keypair (generated once for the lab)
  private readonly RSA_PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAyv3AqNKJ7iH0Pf4vqB4mZ5EXAMPLE_PRIVATE_KEY_HERE
... (truncated for brevity)
-----END RSA PRIVATE KEY-----`;

  private readonly RSA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyv3AqNKJ7iH0Pf4vqB4m
Z5EXAMPLE_PUBLIC_KEY_HERE
-----END PUBLIC KEY-----`;

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

    // يصدر RS256 token
    const token = jwt.sign(
      { username: user.username, role: user.role },
      this.RSA_PRIVATE_KEY,
      { algorithm: 'RS256', expiresIn: '1h' },
    );

    return {
      success: true,
      token,
      user: { username: user.username, role: user.role },
      note: 'This token uses RS256 (asymmetric). Download the public key from /.well-known/jwks.json',
    };
  }

  async getJWKS() {
    // تحويل public key إلى JWK format (simplified)
    return {
      keys: [
        {
          kty: 'RSA',
          kid: 'bank-key-2026',
          use: 'sig',
          alg: 'RS256',
          n: 'yv3AqNKJ7iH0Pf4vqB4mZ5...', // base64url encoded modulus
          e: 'AQAB', // exponent
        },
      ],
    };
  }

  async getPublicKeyPEM() {
    return {
      publicKey: this.RSA_PUBLIC_KEY,
      format: 'PEM',
      note: 'Use this public key to verify RS256 tokens. Or... use it as an HMAC secret for HS256? 🤔',
    };
  }

  // ❌ الثغرة: Algorithm confusion — يقبل HS256 ويستخدم public key كـ secret
  async getAdminTransactions(
    userId: string,
    labId: string,
    authHeader?: string,
  ) {
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

      const algorithm = decodedToken.header.alg;

      // ❌ الثغرة: يقبل HS256 ويستخدم RSA public key كـ HMAC secret
      if (algorithm === 'HS256') {
        decoded = jwt.verify(token, this.RSA_PUBLIC_KEY, {
          algorithms: ['HS256'],
        });
      } else if (algorithm === 'RS256') {
        decoded = jwt.verify(token, this.RSA_PUBLIC_KEY, {
          algorithms: ['RS256'],
        });
      } else {
        throw new UnauthorizedException('Unsupported algorithm');
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (decoded.role !== 'bank_admin') {
      throw new UnauthorizedException({
        error: 'Access denied',
        message: 'Bank admin role required',
        yourRole: decoded.role,
        hint: 'Try converting the RS256 token to HS256 and signing it with the public key',
      });
    }

    const transactions = await this.prisma.labGenericBank.findMany({
      where: { userId, labId },
    });

    const decodedFull = jwt.decode(token, { complete: true }) as any;
    const isExploited = decodedFull?.header?.alg === 'HS256';

    if (isExploited) {
      return {
        success: true,
        exploited: true,
        accounts: transactions.map((t) => ({
          accountNo: t.accountNo,
          balance: t.balance,
          owner: t.ownerName,
        })),
        flag: 'FLAG{JWT_ALG_CONFUSION_RS256_TO_HS256_BANK_PWNED}',
        vulnerability: 'JWT Algorithm Confusion (RS256 → HS256)',
        impact:
          'You exploited algorithm confusion by converting RS256 to HS256 and using the public key as HMAC secret. ' +
          'This bypassed the intended asymmetric verification.',
        fix:
          'Explicitly whitelist allowed algorithms in jwt.verify(): ' +
          'jwt.verify(token, key, { algorithms: ["RS256"] }) — never accept HS256 for RS256 keys.',
      };
    }

    return {
      success: true,
      exploited: false,
      accounts: transactions,
    };
  }
}
