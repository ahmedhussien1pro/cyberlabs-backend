// src/modules/practice-labs/jwt/labs/lab5/lab5.service.ts
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
export class Lab5Service {
  private readonly DEFAULT_PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MII...DEFAULT_KEY...
-----END RSA PRIVATE KEY-----`;

  private readonly DEFAULT_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MII...DEFAULT_PUBLIC_KEY...
-----END PUBLIC KEY-----`;

  // تخزين مؤقت للـ keypairs المولّدة من exploit endpoint
  private exploitKeypairs = new Map<
    string,
    { privateKey: string; publicKey: string }
  >();

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
      this.DEFAULT_PRIVATE_KEY,
      { algorithm: 'RS256', expiresIn: '1h' },
    );

    return {
      success: true,
      token,
      user: { username: user.username, role: user.role },
      note: 'This JWT uses RS256. The backend fetches public keys from a JKU URL when provided.',
    };
  }

  // Exploit helper: يولّد RSA keypair للمهاجم
  async generateKeypair(userId: string) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    });

    // تخزين مؤقت
    this.exploitKeypairs.set(userId, { privateKey, publicKey });

    return {
      success: true,
      privateKey,
      publicKey,
      jwksUrl: '/practice-labs/jwt/lab5/exploit/jwks',
      instructions:
        '1. Use the privateKey to sign a JWT with role: "admin"\n' +
        '2. Add "jku" header pointing to the jwksUrl\n' +
        '3. Add "kid": "exploit-key-1" to match the JWK set\n' +
        '4. Send the forged token to /admin/services',
    };
  }

  // Exploit helper: يعرض malicious JWKS
  async getExploitJWKS(userId: string) {
    const keypair = this.exploitKeypairs.get(userId);

    if (!keypair) {
      throw new BadRequestException(
        'Generate a keypair first via /exploit/generate-keypair',
      );
    }

    // تحويل public key إلى JWK format (simplified)
    return {
      keys: [
        {
          kty: 'RSA',
          kid: 'exploit-key-1',
          use: 'sig',
          alg: 'RS256',
          n: 'base64url_encoded_modulus_here...', // في الواقع يحتاج تحويل حقيقي
          e: 'AQAB',
          // ملاحظة: في lab حقيقي نحتاج jwk-to-pem library
        },
      ],
      note: 'Malicious JWK Set hosted by attacker. Backend will fetch and trust these keys.',
    };
  }

  // ❌ الثغرة: يقبل jku header ويجلب keys من URL بدون validation
  async getAdminServices(userId: string, labId: string, authHeader?: string) {
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

      const jku = decodedToken.header.jku;
      let verificationKey = this.DEFAULT_PUBLIC_KEY;

      // ❌ الثغرة: يقبل jku ويجلب keys من URL خارجي
      if (jku) {
        // محاكاة: fetch من jku URL
        // في الواقع: const response = await fetch(jku); const jwks = await response.json();

        // للتبسيط: نفترض أن jku يشير إلى exploit endpoint
        if (jku.includes('/exploit/jwks')) {
          const keypair = this.exploitKeypairs.get(userId);
          if (keypair) {
            verificationKey = keypair.publicKey; // ❌ يستخدم public key المهاجم!
          }
        }
      }

      decoded = jwt.verify(token, verificationKey, { algorithms: ['RS256'] });
    } catch (error) {
      throw new UnauthorizedException({
        error: 'Invalid or expired token',
        details: error.message,
        hint: 'Generate your own keypair via /exploit/generate-keypair and use jku header injection',
      });
    }

    if (decoded.role !== 'admin') {
      throw new UnauthorizedException({
        error: 'Access denied',
        message: 'Admin role required',
        yourRole: decoded.role,
      });
    }

    const services = await this.prisma.labGenericLog.findMany({
      where: { userId, labId, type: 'SERVICE_REQUEST' },
    });

    const decodedFull = jwt.decode(token, { complete: true }) as any;
    const isExploited = decodedFull?.header?.jku?.includes('exploit');

    if (isExploited) {
      return {
        success: true,
        exploited: true,
        services: services.map((s) => ({
          id: s.id,
          ...(s.meta as any),
        })),
        flag: 'FLAG{JWT_JKU_SSRF_REMOTE_JWK_POISONING_PWNED}',
        vulnerability: 'JWT JKU Header Injection + SSRF + JWK Set Poisoning',
        jkuUsed: decodedFull.header.jku,
        impact:
          'You exploited the jku header to point to your own malicious JWK set. ' +
          'The backend fetched YOUR public key and verified YOUR signature, granting you admin access.',
        fix:
          '1. Never fetch JWK sets from untrusted URLs\n' +
          '2. Whitelist allowed JKU domains (e.g., only *.trusted-idp.com)\n' +
          '3. Use static key configuration instead of dynamic JKU\n' +
          '4. Implement URL validation and SSRF protection',
      };
    }

    return {
      success: true,
      exploited: false,
      services: services.map((s) => s.meta),
    };
  }
}
