// src/modules/practice-labs/wireshark/labs/lab3/lab3.service.ts
// LAB 3 — ARP Trick (Easy)
// Scenario : داخل شبكة LAN، attacker نفّذ ARP Spoofing.
// الطالب يحلل الـ ARP packets ويلاقي الـ Gratuitous ARP (IP مكرر بـ MAC مختلف)
// Flag     : MAC address الـ attacker
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import { FlagRecordService } from '../../../shared/services/flag-record.service';

const FLAG_PREFIX = 'FLAG{WIRESHARK-LAB3-ARP-SPOOF';
// الـ attacker MAC ثابت — الـ dynamic flag هو الـ secret بداخله
const ATTACKER_MAC = 'de:ad:be:ef:13:37';

@Injectable()
export class Lab3Service {
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
      'lab3-arp-attempt',
      result.dynamicFlag,
      24,
    );
    return { status: 'success', message: 'ARP lab environment initialized', labId: result.labId };
  }

  async getCapture(userId: string, labId: string) {
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const dynamicFlag   = this.stateService.generateDynamicFlag(FLAG_PREFIX, userId, resolvedLabId);

    // ─── Mock ARP Packet Capture ─────────────────────────────────────────
    // شبكة 192.168.1.0/24 — gateway هو 192.168.1.1
    // الـ attacker (192.168.1.105) بعت Gratuitous ARP بدّعي إنه الـ gateway
    const packets = [
      {
        no: 1, time: '0.000000',
        source: '00:11:22:33:44:01', destination: 'Broadcast',
        protocol: 'ARP', length: 42,
        info: 'Who has 192.168.1.1? Tell 192.168.1.5',
        arpData: { opcode: 'request', senderIp: '192.168.1.5', senderMac: '00:11:22:33:44:01', targetIp: '192.168.1.1' },
      },
      {
        no: 2, time: '0.001500',
        source: '00:aa:bb:cc:dd:01', destination: '00:11:22:33:44:01',
        protocol: 'ARP', length: 42,
        info: '192.168.1.1 is at 00:aa:bb:cc:dd:01',
        arpData: { opcode: 'reply', senderIp: '192.168.1.1', senderMac: '00:aa:bb:cc:dd:01', targetIp: '192.168.1.5' },
      },
      {
        no: 3, time: '0.020000',
        source: '00:11:22:33:44:02', destination: 'Broadcast',
        protocol: 'ARP', length: 42,
        info: 'Who has 192.168.1.1? Tell 192.168.1.8',
        arpData: { opcode: 'request', senderIp: '192.168.1.8', senderMac: '00:11:22:33:44:02', targetIp: '192.168.1.1' },
      },
      {
        no: 4, time: '0.021200',
        source: '00:aa:bb:cc:dd:01', destination: 'Broadcast',
        protocol: 'ARP', length: 42,
        info: '192.168.1.1 is at 00:aa:bb:cc:dd:01',
        arpData: { opcode: 'reply', senderIp: '192.168.1.1', senderMac: '00:aa:bb:cc:dd:01', targetIp: '192.168.1.8' },
      },
      // ⚠️  Gratuitous ARP من الـ attacker — نفس الـ IP (192.168.1.1) بـ MAC مختلف!
      {
        no: 5, time: '0.045000',
        source: ATTACKER_MAC, destination: 'Broadcast',
        protocol: 'ARP', length: 42,
        info: `192.168.1.1 is at ${ATTACKER_MAC} [GRATUITOUS]`,
        arpData: {
          opcode:    'gratuitous',
          senderIp:  '192.168.1.1',
          senderMac: ATTACKER_MAC,
          targetIp:  '192.168.1.1',
          note:      `Duplicate IP detected! Different MAC — possible ARP Spoofing. Flag: ${dynamicFlag}`,
        },
      },
      {
        no: 6, time: '0.046000',
        source: ATTACKER_MAC, destination: 'Broadcast',
        protocol: 'ARP', length: 42,
        info: `192.168.1.1 is at ${ATTACKER_MAC} [GRATUITOUS]`,
        arpData: {
          opcode:    'gratuitous',
          senderIp:  '192.168.1.1',
          senderMac: ATTACKER_MAC,
          targetIp:  '192.168.1.1',
        },
      },
      {
        no: 7, time: '0.060000',
        source: '00:11:22:33:44:01', destination: 'Broadcast',
        protocol: 'ARP', length: 42,
        info: 'Who has 192.168.1.1? Tell 192.168.1.5',
        arpData: { opcode: 'request', senderIp: '192.168.1.5', senderMac: '00:11:22:33:44:01', targetIp: '192.168.1.1' },
      },
    ];

    return { packets, hint: 'Look for duplicate IPs with different MAC addresses — that is the attacker.' };
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
      'lab3-arp-attempt',
      submittedFlag.trim(),
    );

    if (result === 'correct') {
      return {
        success:     true,
        flag:        submittedFlag.trim(),
        message:     'Correct! You identified the ARP Spoofing attacker.',
        explanation: 'ARP Spoofing (Poisoning) is a MITM technique where an attacker sends ' +
          'Gratuitous ARP replies to associate their MAC with a legitimate IP, ' +
          'redirecting all traffic through their machine. Defense: Dynamic ARP Inspection (DAI) on switches.',
      };
    }
    if (result === 'already_used') return { success: false, message: 'Flag already submitted. Lab is solved!' };
    if (result === 'expired')      return { success: false, message: 'Session expired. Please restart the lab.' };

    return {
      success: false,
      message: 'Incorrect. Find the Gratuitous ARP packet — look for the duplicate IP with a suspicious MAC.',
    };
  }
}
