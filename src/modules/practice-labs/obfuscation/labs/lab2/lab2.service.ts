// src/modules/practice-labs/obfuscation/labs/lab2/lab2.service.ts
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

  async getChallenge(userId: string, labId: string) {
    // Python code obfuscated via eval + base64 + reversed string
    // Original: print("FLAG{PYTHON_EVAL_OBFUSCATION_CRACKED}")
    const originalB64 = Buffer.from(
      'print("FLAG{PYTHON_EVAL_OBFUSCATION_CRACKED}")',
    ).toString('base64');
    const reversed = originalB64.split('').reverse().join('');

    const obfuscatedCode = [
      `import base64`,
      `_x = "${reversed}"`,
      `exec(base64.b64decode(_x[::-1]).decode())`,
    ].join('\n');

    return {
      challenge: {
        code: obfuscatedCode,
        language: 'Python',
        task: 'Trace the execution of this obfuscated Python script and find the flag it prints.',
      },
      instructions:
        'The code reverses a string then decodes Base64. Manually trace each step or run it in a safe environment. Submit the flag as FLAG{...}.',
    };
  }

  async submitFlag(userId: string, labId: string, submittedFlag: string) {
    if (!submittedFlag) throw new BadRequestException('flag is required');

    const correct = 'FLAG{PYTHON_EVAL_OBFUSCATION_CRACKED}';
    const isCorrect = submittedFlag.trim().toUpperCase() === correct.toUpperCase();

    if (!isCorrect) {
      return {
        success: false,
        message: 'Not quite. Trace _x[::-1] first, then decode the Base64 result.',
      };
    }

    return {
      success: true,
      flag: correct,
      message: 'Excellent! You reversed the multi-layer Python obfuscation.',
      explanation:
        'eval(base64.b64decode(...)) combined with string reversal is a common Python obfuscation. ' +
        'Always analyze code statically before running unknown scripts.',
    };
  }
}
