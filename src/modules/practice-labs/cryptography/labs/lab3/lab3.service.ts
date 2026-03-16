// src/modules/practice-labs/cryptography/labs/lab3/lab3.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import { PrismaService } from '../../../../../core/database';

@Injectable()
export class Lab3Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // RSA with small primes (intentionally weak for educational purposes)
  async getChallenge(userId: string, labId: string) {
    // p=61, q=53 → n=3233, e=17
    // plaintext = 65 → ciphertext = 65^17 mod 3233 = 2790
    return {
      challenge: {
        n: 3233,
        e: 17,
        ciphertext: 2790,
        note: 'n is a product of two small prime numbers. Factor n to find p and q, then compute the private key d.',
      },
      instructions:
        'Factor n into p and q. Compute φ(n) = (p-1)(q-1). ' +
        'Find d such that d*e ≡ 1 (mod φ(n)). ' +
        'Decrypt: plaintext = ciphertext^d mod n. ' +
        'The plaintext is a number — convert it to ASCII. Submit as FLAG{CHAR}.',
    };
  }

  async submitFlag(userId: string, labId: string, submittedFlag: string) {
    if (!submittedFlag) throw new BadRequestException('flag is required');

    // plaintext = 65 = ASCII 'A'
    const correct = 'FLAG{A}';
    const isCorrect = submittedFlag.trim().toUpperCase() === correct.toUpperCase();

    if (!isCorrect) {
      return {
        success: false,
        message: 'Incorrect. Did you factor n=3233 correctly? Try p=61, q=53.',
      };
    }

    return {
      success: true,
      flag: correct,
      solution: { p: 61, q: 53, phi: 3120, d: 2753, plaintext: 65, ascii: 'A' },
      message: 'Perfect! You successfully broke RSA with weak primes.',
      explanation:
        'Real RSA uses primes with hundreds of digits. Small primes like 61 and 53 ' +
        'can be factored in milliseconds, making the private key trivially recoverable.',
    };
  }
}
