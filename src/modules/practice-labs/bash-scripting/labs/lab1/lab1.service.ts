// src/modules/practice-labs/bash-scripting/labs/lab1/lab1.service.ts
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

  async getChallenge(userId: string, labId: string) {
    // Script مشفر بـ base64 يحتوي على flag
    // Original script:
    // #!/bin/bash
    // key="FLAG{BASH_BASE64_DECODE_MASTER}"
    // echo $key
    const originalScript = '#!/bin/bash\nkey="FLAG{BASH_BASE64_DECODE_MASTER}"\necho $key';
    const encoded = Buffer.from(originalScript).toString('base64');

    return {
      challenge: {
        encodedScript: encoded,
        description: 'This bash script was encoded in Base64. Decode it to find the flag.',
        hint: 'Use: echo "<encoded>" | base64 -d',
      },
      instructions:
        'Decode the Base64 string to reveal the bash script. Read the script and find the flag value. Submit as FLAG{...}.',
    };
  }

  async submitFlag(userId: string, labId: string, submittedFlag: string) {
    if (!submittedFlag) throw new BadRequestException('flag is required');

    const correct = 'FLAG{BASH_BASE64_DECODE_MASTER}';
    const isCorrect = submittedFlag.trim().toUpperCase() === correct.toUpperCase();

    if (!isCorrect) {
      return {
        success: false,
        message: 'Incorrect. Did you fully decode the Base64 and read the script?',
      };
    }

    return {
      success: true,
      flag: correct,
      message: 'Well done! You decoded the bash script and extracted the flag.',
      originalScript: '#!/bin/bash\nkey="FLAG{BASH_BASE64_DECODE_MASTER}"\necho $key',
      explanation:
        'Base64 encoding is often used to obfuscate scripts in CTF challenges and real malware. ' +
        'Always check for Base64-encoded payloads in scripts, environment variables, and config files.',
    };
  }
}
