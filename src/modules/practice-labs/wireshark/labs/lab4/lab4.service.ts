// src/modules/practice-labs/wireshark/labs/lab4/lab4.service.ts
// LAB 4 — TCP Intrusion (Medium)
// Scenario : Server تحت هجوم — port scan + brute force على SSH
// الطالب يحلل الـ TCP flags ويحدد الـ attacker IP
// Flag     : attacker IP address
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import { FlagRecordService } from '../../../shared/services/flag-record.service';

const FLAG_PREFIX  = 'FLAG{WIRESHARK-LAB4-TCP-INTRUSION';
const ATTACKER_IP  = '10.0.0.99';
const VICTIM_IP    = '10.0.0.5';

@Injectable()
export class Lab4Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
    private flagRecord: FlagRecordService,
  ) {}

  async initLab(userId: string, labId: string) {
    const result = await this.stateService.initializeState(userId, labId);
    await this.flagRecord.generateAndStore(
      userId,
      result.labId,
      'lab4-tcp-attempt',
      result.dynamicFlag,
      24,
    );
    return { status: 'success', message: 'TCP Intrusion lab initialized', labId: result.labId };
  }

  async getCapture(userId: string, labId: string) {
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const dynamicFlag   = this.stateService.generateDynamicFlag(FLAG_PREFIX, userId, resolvedLabId);

    // ─── Mock TCP Packet Capture ──────────────────────────────────────────
    // Phase 1: Normal traffic
    // Phase 2: SYN Scan من 10.0.0.99 (port scanner)
    // Phase 3: SSH Brute force attempts
    const packets = [
      // Normal traffic
      { no: 1,  time: '0.000000', source: '10.0.0.3',       destination: `${VICTIM_IP}:80`,  protocol: 'TCP', length: 74,  info: '51234 → 80 [SYN]',           flags: 'SYN' },
      { no: 2,  time: '0.000800', source: VICTIM_IP,         destination: '10.0.0.3',         protocol: 'TCP', length: 74,  info: '80 → 51234 [SYN, ACK]',       flags: 'SYN,ACK' },
      { no: 3,  time: '0.001200', source: '10.0.0.3',       destination: `${VICTIM_IP}:80`,  protocol: 'TCP', length: 66,  info: '51234 → 80 [ACK]',            flags: 'ACK' },
      { no: 4,  time: '0.002000', source: '10.0.0.7',       destination: `${VICTIM_IP}:443`, protocol: 'TCP', length: 74,  info: '43210 → 443 [SYN]',           flags: 'SYN' },
      // ─── Phase 2: SYN Scan from attacker ──────────────────────────────────
      { no: 5,  time: '1.000000', source: ATTACKER_IP,      destination: `${VICTIM_IP}:22`,  protocol: 'TCP', length: 58,  info: `PORT SCAN: ${ATTACKER_IP} → 22 [SYN]`,   flags: 'SYN', scanData: { isScan: true } },
      { no: 6,  time: '1.000200', source: VICTIM_IP,        destination: ATTACKER_IP,         protocol: 'TCP', length: 58,  info: '22 → attacker [RST, ACK]',    flags: 'RST,ACK' },
      { no: 7,  time: '1.000400', source: ATTACKER_IP,      destination: `${VICTIM_IP}:23`,  protocol: 'TCP', length: 58,  info: `PORT SCAN: ${ATTACKER_IP} → 23 [SYN]`,   flags: 'SYN', scanData: { isScan: true } },
      { no: 8,  time: '1.000600', source: VICTIM_IP,        destination: ATTACKER_IP,         protocol: 'TCP', length: 58,  info: '23 → attacker [RST, ACK]',    flags: 'RST,ACK' },
      { no: 9,  time: '1.000800', source: ATTACKER_IP,      destination: `${VICTIM_IP}:80`,  protocol: 'TCP', length: 58,  info: `PORT SCAN: ${ATTACKER_IP} → 80 [SYN]`,   flags: 'SYN', scanData: { isScan: true } },
      { no: 10, time: '1.001000', source: VICTIM_IP,        destination: ATTACKER_IP,         protocol: 'TCP', length: 74,  info: '80 → attacker [SYN, ACK]',    flags: 'SYN,ACK' },
      { no: 11, time: '1.001200', source: ATTACKER_IP,      destination: `${VICTIM_IP}:443`, protocol: 'TCP', length: 58,  info: `PORT SCAN: ${ATTACKER_IP} → 443 [SYN]`,  flags: 'SYN', scanData: { isScan: true } },
      { no: 12, time: '1.001400', source: VICTIM_IP,        destination: ATTACKER_IP,         protocol: 'TCP', length: 74,  info: '443 → attacker [SYN, ACK]',   flags: 'SYN,ACK' },
      { no: 13, time: '1.001600', source: ATTACKER_IP,      destination: `${VICTIM_IP}:8080`,protocol: 'TCP', length: 58,  info: `PORT SCAN: ${ATTACKER_IP} → 8080 [SYN]`, flags: 'SYN', scanData: { isScan: true } },
      { no: 14, time: '1.001800', source: VICTIM_IP,        destination: ATTACKER_IP,         protocol: 'TCP', length: 58,  info: '8080 → attacker [RST, ACK]',  flags: 'RST,ACK' },
      // ─── Phase 3: SSH Brute Force ──────────────────────────────────────────
      { no: 15, time: '2.000000', source: ATTACKER_IP,      destination: `${VICTIM_IP}:22`,  protocol: 'SSH', length: 100, info: `BRUTE FORCE: ${ATTACKER_IP} → SSH Login attempt #1`, flags: 'PSH,ACK',
        sshData: { attempt: 1, note: `Multiple rapid SSH connections from same IP. Flag hidden: ${dynamicFlag}` } },
      { no: 16, time: '2.000500', source: ATTACKER_IP,      destination: `${VICTIM_IP}:22`,  protocol: 'SSH', length: 100, info: `BRUTE FORCE: ${ATTACKER_IP} → SSH Login attempt #2`, flags: 'PSH,ACK', sshData: { attempt: 2 } },
      { no: 17, time: '2.001000', source: ATTACKER_IP,      destination: `${VICTIM_IP}:22`,  protocol: 'SSH', length: 100, info: `BRUTE FORCE: ${ATTACKER_IP} → SSH Login attempt #3`, flags: 'PSH,ACK', sshData: { attempt: 3 } },
      { no: 18, time: '2.001500', source: ATTACKER_IP,      destination: `${VICTIM_IP}:22`,  protocol: 'SSH', length: 100, info: `BRUTE FORCE: ${ATTACKER_IP} → SSH Login attempt #4`, flags: 'PSH,ACK', sshData: { attempt: 4 } },
    ];

    return {
      packets,
      hint: 'Filter by TCP. One IP sends many SYN packets to different ports — that is the scanner.',
    };
  }

  async getProgress(userId: string, labId: string) {
    try {
      const resolvedLabId = await this.stateService.resolveLabId(labId);
      const progress = await this.prisma.userLabProgress.findFirst({
        where:  { userId, labId: resolvedLabId },
        select: { flagSubmitted: true, hintsUsed: true, startedAt: true, completedAt: true },
      });
      return {
        step:          progress?.flagSubmitted ? 'COMPLETED' : 'RUNNING',
        flagSubmitted: progress?.flagSubmitted ?? false,
        hintsUsed:     progress?.hintsUsed     ?? 0,
        startedAt:     progress?.startedAt     ?? null,
        completedAt:   progress?.completedAt   ?? null,
      };
    } catch {
      return { step: 'RUNNING', flagSubmitted: false, hintsUsed: 0 };
    }
  }

  async submitFlag(userId: string, labId: string, submittedFlag: string) {
    if (!submittedFlag?.trim()) throw new BadRequestException('flag is required');

    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const result = await this.flagRecord.verifyAndConsume(
      userId,
      resolvedLabId,
      'lab4-tcp-attempt',
      submittedFlag.trim(),
    );

    if (result === 'correct') {
      return {
        success:     true,
        flag:        submittedFlag.trim(),
        message:     `Correct! You identified the intruder: ${ATTACKER_IP}`,
        explanation: 'A SYN scan sends SYN packets to many ports rapidly. ' +
          'If a port is open, the server replies SYN/ACK. The attacker then sends RST to avoid completing the handshake. ' +
          'IDS/IPS systems detect this pattern by counting SYN packets per IP per second.',
      };
    }
    if (result === 'already_used') return { success: false, message: 'Flag already submitted. Lab is solved!' };
    if (result === 'expired')      return { success: false, message: 'Session expired. Please restart the lab.' };

    return {
      success: false,
      message: 'Incorrect. Filter TCP and look for the IP sending rapid SYN packets to many ports.',
    };
  }
}
