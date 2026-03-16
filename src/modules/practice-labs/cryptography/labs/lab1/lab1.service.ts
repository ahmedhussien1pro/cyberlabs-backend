// src/modules/practice-labs/cryptography/labs/lab1/lab1.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
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

  // يعطي المستخدم نصاً مشفراً بـ Caesar cipher
  async getChallenge(userId: string, labId: string) {
    const shift = 13; // ROT13
    const plaintext = 'FLAG_CRYPTO_CAESAR_CRACKED';
    const encrypted = plaintext
      .split('')
      .map((c) => {
        if (c >= 'A' && c <= 'Z') {
          return String.fromCharCode(((c.charCodeAt(0) - 65 + shift) % 26) + 65);
        }
        if (c >= 'a' && c <= 'z') {
          return String.fromCharCode(((c.charCodeAt(0) - 97 + shift) % 26) + 97);
        }
        return c;
      })
      .join('');

    return {
      challenge: {
        ciphertext: encrypted,
        algorithm: 'Caesar Cipher',
        hint: 'Every letter is shifted by the same number of positions in the alphabet.',
        example: 'A shifted by 3 = D',
      },
      instructions:
        'Decode the ciphertext and submit the original plaintext as the flag wrapped in FLAG{...}. Example: FLAG{HELLO_WORLD}',
    };
  }

  // التحقق من الإجابة
  async submitFlag(
    userId: string,
    labId: string,
    submittedFlag: string,
  ) {
    if (!submittedFlag) throw new BadRequestException('flag is required');

    const correct = 'FLAG{FLAG_CRYPTO_CAESAR_CRACKED}';
    const isCorrect =
      submittedFlag.trim().toUpperCase() === correct.toUpperCase();

    if (!isCorrect) {
      return {
        success: false,
        message: 'Wrong answer. Keep trying!',
        hint: 'Try ROT13 — shift each letter by 13 positions.',
      };
    }

    return {
      success: true,
      flag: correct,
      message: 'Correct! You successfully decoded the Caesar cipher.',
      explanation:
        'ROT13 is a special case of the Caesar cipher where the shift is 13. ' +
        'Since the alphabet has 26 letters, applying ROT13 twice returns the original text.',
    };
  }
}
