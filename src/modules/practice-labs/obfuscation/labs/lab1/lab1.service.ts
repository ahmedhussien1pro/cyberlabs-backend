// src/modules/practice-labs/obfuscation/labs/lab1/lab1.service.ts
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
    // Obfuscated JS — hidden password inside
    // Deobfuscated: password = "s3cr3t_0bfusc4t3d"
    const obfuscatedCode = [
      'var _0x3f2a=["\\x73\\x33\\x63\\x72\\x33\\x74\\x5f\\x30\\x62\\x66\\x75\\x73\\x63\\x34\\x74\\x33\\x64","\\x6c\\x6f\\x67"];',
      '(function(_0x4e1d,_0x2b3c){',
      '  var _0x1a2b=function(_0x3c4d){',
      '    while(--_0x3c4d){_0x4e1d["push"](_0x4e1d["shift"]());}',
      '  };_0x1a2b(++_0x2b3c);',
      '})(_0x3f2a,0x1b3);',
      'var _0xf1e2=function(_0x3a4b,_0x2c1d){',
      '  _0x3a4b=_0x3a4b-0x0;',
      '  return _0x3f2a[_0x3a4b];',
      '};',
      'var password=_0xf1e2("0x1");',
      'if(userInput===password){ console[_0xf1e2("0x0")]("Access Granted"); }',
    ].join('\n');

    return {
      challenge: {
        code: obfuscatedCode,
        language: 'JavaScript',
        task: 'Find the hidden password inside this obfuscated code.',
      },
      instructions:
        'Analyze the obfuscated JavaScript. Decode the hex strings and trace the variable assignments to find the password. Submit as FLAG{password}.',
    };
  }

  async submitFlag(userId: string, labId: string, submittedFlag: string) {
    if (!submittedFlag) throw new BadRequestException('flag is required');

    const correct = 'FLAG{s3cr3t_0bfusc4t3d}';
    const isCorrect = submittedFlag.trim() === correct;

    if (!isCorrect) {
      return {
        success: false,
        message: 'Wrong password. Try decoding the hex strings: \\x73\\x33... etc.',
      };
    }

    return {
      success: true,
      flag: correct,
      message: 'Correct! You successfully deobfuscated the JavaScript code.',
      explanation:
        'This technique uses hex-encoded strings and array shuffling to hide the real values. ' +
        'Tools like de4js or jsnice.org can help automate deobfuscation.',
    };
  }
}
