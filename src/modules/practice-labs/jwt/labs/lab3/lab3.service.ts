import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class Lab3Service {
  // Simulated public key (في الواقع ده هيكون RSA public key)
  private readonly PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC7VJTUt9Us8cKjMzEfYyjiWA4R
4yyuwpXrdGCSRJo4HiPX7CvqV0xCYSg0xzA7W4SQ0x6Qj1wk4m7zPl9/xhC0i0Ln
-----END PUBLIC KEY-----`;

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async login(
    userId: string,
    labId: string,
    username: string,
    password: string,
  ) {
    const user = await this.prisma.labGenericUser.findFirst({
      where: { userId, labId, username, password },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    // نرجع token بـ HS256 (simulation)
    const token = jwt.sign(
      { username: user.username, role: user.role },
      'secret',
      { algorithm: 'HS256' },
    );

    return {
      token,
      role: user.role,
      hint: 'Server uses public key for verification...',
      publicKey: this.PUBLIC_KEY,
    };
  }

  async verifyToken(userId: string, labId: string, token: string) {
    try {
      // ❌ الثغرة: يستخدم PUBLIC_KEY كـ secret في HS256
      const decoded = jwt.verify(token, this.PUBLIC_KEY) as any;

      if (decoded.role === 'SUPERADMIN') {
        return {
          success: true,
          role: decoded.role,
          flag: 'FLAG{JWT_ALGORITHM_CONFUSION_MASTER}',
          exploited: true,
        };
      }

      return { success: true, role: decoded.role };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
