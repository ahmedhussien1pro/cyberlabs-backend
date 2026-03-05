// src/modules/practice-labs/idor/labs/lab2/lab2.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab2Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async getMyKeys(userId: string, labId: string) {
    const myKey = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, title: 'KEY-201' },
    });

    return {
      success: true,
      keys: myKey ? [{ keyId: myKey.title, ...JSON.parse(myKey.body) }] : [],
      note: 'These are your API keys. Use /api-keys/view to access key details by ID.',
    };
  }

  // ❌ الثغرة: يعرض أي key بدون ownership check
  async viewKey(userId: string, labId: string, keyId: string) {
    if (!keyId) throw new BadRequestException('keyId is required');

    const key = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, title: keyId },
    });

    if (!key) {
      return {
        success: false,
        error: 'API key not found',
        hint: 'Try KEY-201 through KEY-210',
      };
    }

    let keyData: any = {};
    try {
      keyData = JSON.parse(key.body);
    } catch {
      keyData = {};
    }

    const isOwn = keyId === 'KEY-201';
    const isAdmin = key.author === 'admin_apikey';

    if (isAdmin) {
      return {
        success: true,
        exploited: true,
        keyId,
        apiKey: keyData,
        flag:
          keyData.permissions
            ?.find((p: string) => p.startsWith('flag:'))
            ?.replace('flag:', '') ||
          'FLAG{IDOR_API_KEY_STOLEN_DEVHUB_ADMIN_COMPROMISED}',
        vulnerability:
          'IDOR — API Key Management without Ownership Verification',
        impact:
          'You stole the master API key with full platform access. An attacker could use this to: access all user data, modify billing, delete accounts, and fully control the platform.',
        fix: 'Add ownership verification: WHERE id = keyId AND ownerId = authenticatedUserId',
      };
    }

    return {
      success: true,
      exploited: !isOwn,
      keyId,
      apiKey: keyData,
      note: isOwn
        ? 'This is your own API key.'
        : `⚠️ This key belongs to "${keyData.owner}". Keep enumerating to find the admin master key.`,
    };
  }
}
