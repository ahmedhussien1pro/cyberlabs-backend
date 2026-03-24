// src/modules/practice-labs/bash-scripting/labs/lab1/lab1.service.ts
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

/**
 * Lab 1 — "Decode the Malicious Dropper"
 *
 * The script is base64-encoded.  The encoded payload contains a real bash
 * script with a deliberately obfuscated variable.  The student must:
 *
 *   STEP_1 → identify the encoding type  (answer: "base64")
 *   STEP_2 → decode and read the hidden variable name  (answer: "SECRET_KEY")
 *   STEP_3 → extract the seed value embedded in the variable assignment
 *            (answer: the dynamic seed stored server-side — NOT the flag itself)
 *
 * Only after all 3 steps are verified can the student call /submit.
 * The flag is NEVER returned in challenge, command output, or step responses.
 */

const FLAG_PREFIX = 'FLAG{BASH_LAB1_BASE64_SCRIPT';

// In-memory step tracker  { "userId:labId" → Set<step> }
const stepStore = new Map<string, Set<string>>();

const key = (userId: string, labId: string) => `${userId}:${labId}`;

@Injectable()
export class Lab1Service {
  constructor(private stateService: PracticeLabStateService) {}

  // ── Init ───────────────────────────────────────────────────────────────────
  async initLab(userId: string, labId: string) {
    const result = await this.stateService.initializeState(userId, labId);
    // reset step progress on every start
    stepStore.delete(key(userId, result.labId));
    return { status: 'success', message: 'Lab environment initialized' };
  }

  // ── Challenge ──────────────────────────────────────────────────────────────
  async getChallenge(userId: string, labId: string) {
    const resolvedLabId = await this.stateService.resolveLabId(labId);

    // Build the inner script — SECRET_KEY holds a seed, NOT the flag
    const seed = this._seed(userId, resolvedLabId);
    const innerScript = [
      '#!/bin/bash',
      '# Malicious dropper — found on compromised host',
      `SECRET_KEY="${seed}"`,
      'ENCODED_CMD="aGVjawo="',
      'eval $(echo $ENCODED_CMD | base64 -d)',
      'echo "[dropper] exfil initiated"',
    ].join('\n');

    const encoded = Buffer.from(innerScript).toString('base64');

    return {
      challenge: {
        // Only the base64 blob — student must decode it
        encodedScript: encoded,
        task: 'A suspicious base64-encoded script was found on a compromised host. Decode it layer by layer, understand its structure, and submit the hidden seed value.',
        steps: [
          { id: 'STEP_1', label: 'Identify the encoding type used for the outer script' },
          { id: 'STEP_2', label: 'Decode the script and find the hidden variable name' },
          { id: 'STEP_3', label: 'Extract the seed value assigned to that variable' },
        ],
      },
    };
  }

  // ── Verify Step ────────────────────────────────────────────────────────────
  async verifyStep(
    userId: string,
    labId: string,
    step: string,
    answer: string,
  ) {
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const k = key(userId, resolvedLabId);
    if (!stepStore.has(k)) stepStore.set(k, new Set());
    const done = stepStore.get(k)!;

    const norm = (s: string) => s.trim().toLowerCase();

    switch (step) {
      case 'STEP_1': {
        if (norm(answer) !== 'base64') {
          return { correct: false, feedback: 'Not quite. Look at the encoding characters — what command decodes this format?' };
        }
        done.add('STEP_1');
        return { correct: true, feedback: '✅ Correct! The script is Base64-encoded. Use: echo "<blob>" | base64 -d' };
      }

      case 'STEP_2': {
        if (!done.has('STEP_1')) throw new ForbiddenException('Complete STEP_1 first');
        if (norm(answer) !== 'secret_key') {
          return { correct: false, feedback: 'Decode the script first, then read the variable assignments carefully.' };
        }
        done.add('STEP_2');
        return { correct: true, feedback: '✅ Found it! SECRET_KEY holds the critical data. Now extract its value.' };
      }

      case 'STEP_3': {
        if (!done.has('STEP_2')) throw new ForbiddenException('Complete STEP_2 first');
        const expected = this._seed(userId, resolvedLabId);
        if (answer.trim() !== expected) {
          return { correct: false, feedback: 'That\'s not the right seed value. Decode the script again and copy SECRET_KEY\'s value exactly.' };
        }
        done.add('STEP_3');
        return {
          correct: true,
          feedback: '✅ All steps complete! You can now submit to get the flag.',
          allStepsDone: true,
        };
      }

      default:
        throw new BadRequestException('Invalid step. Valid values: STEP_1, STEP_2, STEP_3');
    }
  }

  // ── Progress ───────────────────────────────────────────────────────────────
  async getProgress(userId: string, labId: string) {
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const done = stepStore.get(key(userId, resolvedLabId)) ?? new Set<string>();
    return {
      completedSteps: [...done],
      allStepsDone: done.has('STEP_1') && done.has('STEP_2') && done.has('STEP_3'),
    };
  }

  // ── Submit Flag ────────────────────────────────────────────────────────────
  async submitFlag(userId: string, labId: string, submittedFlag: string) {
    if (!submittedFlag) throw new BadRequestException('flag is required');

    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const done = stepStore.get(key(userId, resolvedLabId)) ?? new Set<string>();

    if (!done.has('STEP_1') || !done.has('STEP_2') || !done.has('STEP_3')) {
      throw new ForbiddenException('Complete all 3 steps before submitting the flag');
    }

    const isCorrect = this.stateService.verifyDynamicFlag(
      FLAG_PREFIX,
      userId,
      resolvedLabId,
      submittedFlag,
    );

    if (!isCorrect) {
      return { success: false, message: 'Incorrect flag. Generate it properly from the seed you extracted.' };
    }

    // Clean up
    stepStore.delete(key(userId, resolvedLabId));

    const flag = this.stateService.generateDynamicFlag(FLAG_PREFIX, userId, resolvedLabId);
    return {
      success: true,
      flag,
      message: 'Well done! You decoded the dropper script and extracted the hidden seed.',
      explanation:
        'Base64 encoding is used in real-world malware to hide payloads inside scripts, ' +
        'environment variables, and cron jobs. Always decode layers and examine variable assignments.',
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  /** Deterministic short seed tied to user+lab — not the flag itself */
  private _seed(userId: string, labId: string): string {
    const raw = `seed:${userId}:${labId}`;
    return Buffer.from(raw).toString('base64').slice(0, 16).toUpperCase();
  }
}
