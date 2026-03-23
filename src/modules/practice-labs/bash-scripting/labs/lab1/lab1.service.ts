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
    const resolvedLabId = await this.stateService.resolveLabId(labId);

    const dynamicFlag = this.stateService.generateDynamicFlag(
      'FLAG{BASH_LAB1_BASE64_SCRIPT',
      userId,
      resolvedLabId,
    );

    const originalScript = `#!/bin/bash\nkey="${dynamicFlag}"\necho $key`;
    const encoded = Buffer.from(originalScript).toString('base64');

    return {
      challenge: {
        script: encoded,
        task: 'This bash script was encoded in Base64. Decode it to find the flag.',
        hint: 'Use: echo "<encoded>" | base64 -d',
      },
      instructions:
        'Decode the Base64 string to reveal the bash script. Read the script and find the flag value. Submit as FLAG{...}.',
    };
  }

  async submitFlag(userId: string, labId: string, submittedFlag: string) {
    if (!submittedFlag) throw new BadRequestException('flag is required');

    const resolvedLabId = await this.stateService.resolveLabId(labId);

    const isCorrect = this.stateService.verifyDynamicFlag(
      'FLAG{BASH_LAB1_BASE64_SCRIPT',
      userId,
      resolvedLabId,
      submittedFlag,
    );

    if (!isCorrect) {
      return {
        success: false,
        message:
          'Incorrect. Did you fully decode the Base64 and read the script?',
      };
    }

    const dynamicFlag = this.stateService.generateDynamicFlag(
      'FLAG{BASH_LAB1_BASE64_SCRIPT',
      userId,
      resolvedLabId,
    );

    return {
      success: true,
      flag: dynamicFlag,
      message: 'Well done! You decoded the bash script and extracted the flag.',
      explanation:
        'Base64 encoding is often used to obfuscate scripts in CTF challenges and real malware. ' +
        'Always check for Base64-encoded payloads in scripts, environment variables, and config files.',
    };
  }
}
