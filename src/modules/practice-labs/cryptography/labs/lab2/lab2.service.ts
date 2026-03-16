// src/modules/practice-labs/cryptography/labs/lab2/lab2.service.ts
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

  // XOR key ثابت ثم Base64
  private xorKey = 42;
  private plainFlag = 'FLAG{XOR_AND_BASE64_DECODED}';

  async getChallenge(userId: string, labId: string) {
    const xored = Buffer.from(
      this.plainFlag.split('').map((c) => c.charCodeAt(0) ^ this.xorKey),
    );
    const encoded = xored.toString('base64');

    return {
      challenge: {
        ciphertext: encoded,
        layers: ['Base64', 'XOR'],
        note: 'The data was first XOR-encrypted, then Base64-encoded. Reverse the steps.',
      },
      instructions:
        'Decode Base64 first, then XOR each byte with the key. The XOR key is a single-digit number between 1 and 100. Submit as FLAG{...}',
    };
  }

  async submitFlag(userId: string, labId: string, submittedFlag: string) {
    if (!submittedFlag) throw new BadRequestException('flag is required');

    const isCorrect =
      submittedFlag.trim().toUpperCase() === this.plainFlag.toUpperCase();

    if (!isCorrect) {
      return {
        success: false,
        message: 'Incorrect. Remember: decode Base64 first, then XOR with the correct key.',
      };
    }

    return {
      success: true,
      flag: this.plainFlag,
      xorKey: this.xorKey,
      message: 'Excellent! You successfully reversed the XOR + Base64 encoding.',
      explanation:
        'XOR cipher with a known or brute-forced key combined with Base64 encoding ' +
        'is a common obfuscation technique, not real encryption.',
    };
  }
}
