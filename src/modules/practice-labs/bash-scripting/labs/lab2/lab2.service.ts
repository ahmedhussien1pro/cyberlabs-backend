// src/modules/practice-labs/bash-scripting/labs/lab2/lab2.service.ts
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

/**
 * Lab 2 — "Breach Investigation"
 *
 * Steps:
 *   STEP_1 → Identify the attacker’s IP  (answer: "45.33.32.156")
 *   STEP_2 → Count failed login attempts  (answer: "7")
 *             → grep -c "failed_login" = 7  |  grep -c "45.33.32.156" = 7
 *             → The ERROR line intentionally has NO ip= field
 *   STEP_3 → Timestamp of privilege-escalation  (answer: "2026-03-17 00:04:02")
 *
 * Flag is NEVER in any log line or command output.
 */

const FLAG_PREFIX = 'FLAG{BASH_LAB2_LOG_ANALYSIS';

const stepStore = new Map<string, Set<string>>();
const key = (u: string, l: string) => `${u}:${l}`;

/**
 * ⚠️  ERROR line deliberately omits ip= so that:
 *        grep -c "45.33.32.156" → 7  (only the 7 WARN lines match)
 *        grep -c "failed_login"  → 7  (same result)
 */
const LOG_LINES = [
  '2026-03-17 00:01:12 INFO  user=alice   action=login         ip=192.168.1.10',
  '2026-03-17 00:01:45 INFO  user=bob     action=login         ip=10.0.0.5',
  '2026-03-17 00:02:03 INFO  user=carol   action=login         ip=172.16.0.3',
  '2026-03-17 00:02:10 WARN  user=unknown action=failed_login  ip=45.33.32.156',
  '2026-03-17 00:02:11 WARN  user=unknown action=failed_login  ip=45.33.32.156',
  '2026-03-17 00:02:12 WARN  user=unknown action=failed_login  ip=45.33.32.156',
  '2026-03-17 00:02:13 WARN  user=unknown action=failed_login  ip=45.33.32.156',
  '2026-03-17 00:02:14 WARN  user=unknown action=failed_login  ip=45.33.32.156',
  '2026-03-17 00:02:15 WARN  user=unknown action=failed_login  ip=45.33.32.156',
  '2026-03-17 00:02:16 WARN  user=unknown action=failed_login  ip=45.33.32.156',
  '2026-03-17 00:03:10 INFO  user=alice   action=view_report   ip=192.168.1.10',
  '2026-03-17 00:03:45 INFO  user=bob     action=logout        ip=10.0.0.5',
  // No ip= here — so grep -c "45.33.32.156" still returns exactly 7
  '2026-03-17 00:04:02 ERROR user=unknown action=priv_escalation token=7f3a9c2b',
  '2026-03-17 00:04:30 INFO  user=carol   action=logout        ip=172.16.0.3',
  '2026-03-17 00:05:00 INFO  user=alice   action=logout        ip=192.168.1.10',
];

@Injectable()
export class Lab2Service {
  constructor(private stateService: PracticeLabStateService) {}

  async initLab(userId: string, labId: string) {
    const result = await this.stateService.initializeState(userId, labId);
    stepStore.delete(key(userId, result.labId));
    return { status: 'success', message: 'Log analysis environment ready' };
  }

  async getChallenge(_userId: string, _labId: string) {
    return {
      challenge: {
        task: 'A web server was breached last night. You have its full access log. Investigate the attack: identify the attacker, measure the brute-force attempt, and pinpoint when they escalated privileges.',
        logFile: '/var/log/access.log',
        steps: [
          { id: 'STEP_1', label: 'Identify the attacker’s IP address' },
          { id: 'STEP_2', label: 'Count the total failed login attempts from that IP' },
          { id: 'STEP_3', label: 'Find the exact timestamp of the privilege escalation event' },
        ],
        availableCommands: [
          'cat /var/log/access.log',
          'grep "PATTERN" /var/log/access.log',
          'grep -c "PATTERN" /var/log/access.log',
          'awk "/PATTERN/{print}" /var/log/access.log',
          'awk "{print $N}" /var/log/access.log',
          'cut -d" " -fN /var/log/access.log',
          'sort /var/log/access.log',
        ],
      },
    };
  }

  async runCommand(_userId: string, _labId: string, cmd: string): Promise<{ output: string }> {
    const t = cmd.trim();

    if (/^cat\s+(\/var\/log\/)?access\.log$/.test(t))
      return { output: LOG_LINES.join('\n') };

    if (/^ls(\s+\/var\/log\/?)?$/.test(t))
      return { output: 'access.log' };

    // grep -c  — count matching lines
    const grepC = t.match(/^grep\s+-c\s+['"]?([^'"\s]+)['"]?/);
    if (grepC) {
      const count = LOG_LINES.filter((l) => l.includes(grepC[1])).length;
      return { output: String(count) };
    }

    // grep (plain)
    const grepM = t.match(/^grep\s+(-i\s+)?['"]?([^'"\s]+)['"]?/);
    if (grepM) {
      const pattern = grepM[2];
      const ci = !!grepM[1];
      const matched = LOG_LINES.filter((l) =>
        ci ? l.toLowerCase().includes(pattern.toLowerCase()) : l.includes(pattern),
      );
      return { output: matched.length ? matched.join('\n') : '(no match)' };
    }

    // awk
    if (t.startsWith('awk')) {
      const filterM = t.match(/\/([^/]+)\/{print}/);
      if (filterM) {
        const matched = LOG_LINES.filter((l) => l.includes(filterM[1]));
        return { output: matched.length ? matched.join('\n') : '(no match)' };
      }
      const fieldM = t.match(/\$([0-9]+)/);
      if (fieldM) {
        const idx = parseInt(fieldM[1], 10) - 1;
        return { output: LOG_LINES.map((l) => l.split(/\s+/)[idx] ?? '').join('\n') || '(no output)' };
      }
      return { output: '(awk: unsupported expression)' };
    }

    // cut
    if (t.startsWith('cut')) {
      const fM = t.match(/-f(\d+)/);
      const dM = t.match(/-d["']?([^"'\s]+)/);
      const delim = dM?.[1] ?? '\t';
      const fi = fM ? parseInt(fM[1], 10) - 1 : 0;
      return { output: LOG_LINES.map((l) => l.split(delim)[fi] ?? '').join('\n') || '(no output)' };
    }

    // sort
    if (t.startsWith('sort'))
      return { output: [...LOG_LINES].sort().join('\n') };

    // help
    if (t === 'help') {
      return {
        output: [
          'Available commands:',
          '  cat /var/log/access.log            — view full log',
          '  grep "PATTERN" /var/log/access.log — filter lines',
          '  grep -c "PATTERN" access.log       — count matching lines',
          '  awk "/PATTERN/{print}" access.log  — pattern-based extraction',
          '  awk "{print $N}" access.log        — extract Nth field',
          '  cut -d" " -fN access.log           — cut by delimiter',
          '  sort access.log                   — sort lines',
          '  ls /var/log/                      — list available files',
        ].join('\n'),
      };
    }

    return { output: `bash: ${t.split(' ')[0]}: command not found` };
  }

  async verifyStep(userId: string, labId: string, step: string, answer: string) {
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const k = key(userId, resolvedLabId);
    if (!stepStore.has(k)) stepStore.set(k, new Set());
    const done = stepStore.get(k)!;
    const norm = (s: string) => s.trim().toLowerCase();

    switch (step) {
      case 'STEP_1':
        if (norm(answer) !== '45.33.32.156')
          return { correct: false, feedback: 'Not the attacker. Filter by WARN lines and look for the repeated IP address.' };
        done.add('STEP_1');
        return { correct: true, feedback: '✅ Correct attacker IP! Now count how many times they failed to log in.' };

      case 'STEP_2':
        if (!done.has('STEP_1')) throw new ForbiddenException('Complete STEP_1 first');
        if (answer.trim() !== '7')
          return { correct: false, feedback: 'Wrong count. Use grep -c "failed_login" to count exactly how many failed attempts there were.' };
        done.add('STEP_2');
        return { correct: true, feedback: '✅ Correct! 7 failed login attempts. Now find when they escalated privileges — look for the ERROR line.' };

      case 'STEP_3':
        if (!done.has('STEP_2')) throw new ForbiddenException('Complete STEP_2 first');
        if (answer.trim() !== '2026-03-17 00:04:02')
          return { correct: false, feedback: 'Wrong timestamp. Filter for the ERROR/priv_escalation line and copy the date+time exactly.' };
        done.add('STEP_3');
        return { correct: true, feedback: '✅ All steps complete! Excellent investigation. Click Submit Flag in the top bar.', allStepsDone: true };

      default:
        throw new BadRequestException('Invalid step. Use STEP_1, STEP_2, or STEP_3');
    }
  }

  async getProgress(userId: string, labId: string) {
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const done = stepStore.get(key(userId, resolvedLabId)) ?? new Set<string>();
    return {
      completedSteps: [...done],
      allStepsDone: done.has('STEP_1') && done.has('STEP_2') && done.has('STEP_3'),
    };
  }

  async submitFlag(userId: string, labId: string, submittedFlag: string) {
    if (!submittedFlag) throw new BadRequestException('flag is required');
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const done = stepStore.get(key(userId, resolvedLabId)) ?? new Set<string>();
    if (!done.has('STEP_1') || !done.has('STEP_2') || !done.has('STEP_3'))
      throw new ForbiddenException('Complete all 3 investigation steps before submitting');

    const isCorrect = this.stateService.verifyDynamicFlag(FLAG_PREFIX, userId, resolvedLabId, submittedFlag);
    if (!isCorrect)
      return { success: false, message: 'Incorrect flag. Did you use the flag generated after completing all steps?' };

    stepStore.delete(key(userId, resolvedLabId));
    const flag = this.stateService.generateDynamicFlag(FLAG_PREFIX, userId, resolvedLabId);
    return {
      success: true,
      flag,
      message: 'Outstanding investigation! You identified the attacker, measured the brute-force, and caught the privilege escalation.',
      explanation:
        'Log analysis with grep/awk is a core skill for incident response. ' +
        'Real breaches leave traces in access logs — knowing how to filter, count, and timestamp events is essential.',
    };
  }
}
