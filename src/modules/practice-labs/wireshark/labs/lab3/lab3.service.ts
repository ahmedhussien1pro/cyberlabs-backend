// src/modules/practice-labs/wireshark/labs/lab3/lab3.service.ts
// LAB 3 — ARP Spoofing Detection
// Flag hidden as Base64 inside arpData.vendor of the attacker gratuitous packet.
import * as fs from 'fs';
import * as path from 'path';
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import { FlagRecordService } from '../../../shared/services/flag-record.service';

const FLAG_PREFIX  = 'FLAG{WIRESHARK-LAB3-ARP-SPOOF';
const ATTACKER_MAC = 'de:ad:be:ef:13:37';
const GATEWAY_MAC  = '00:aa:bb:cc:dd:01';
const PCAP_FILE    = 'lab3_arp_spoof.pcap';
const PCAP_PATH    = path.resolve(process.cwd(), 'labs_assets', 'WireShark', PCAP_FILE);

@Injectable()
export class Lab3Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
    private flagRecord: FlagRecordService,
  ) {}

  async initLab(userId: string, labId: string) {
    const result = await this.stateService.initializeState(userId, labId);
    await this.flagRecord.generateAndStore(userId, result.labId, 'lab3-arp-attempt', result.dynamicFlag, 24);
    return { status: 'success', message: 'ARP lab environment initialized', labId: result.labId };
  }

  async getCapture(userId: string, labId: string) {
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const dynamicFlag   = this.stateService.generateDynamicFlag(FLAG_PREFIX, userId, resolvedLabId);
    const flagEncoded   = Buffer.from(dynamicFlag).toString('base64');

    const packets = [
      {
        no: 1, time: '0.000000',
        source: '00:11:22:33:44:aa', destination: 'Broadcast (ff:ff:ff:ff:ff:ff)',
        protocol: 'ARP', length: 42,
        info: 'Who has 192.168.0.1? Tell 192.168.0.14',
        arpData: { opcode: 'request', senderIp: '192.168.0.14', senderMac: '00:11:22:33:44:aa', targetIp: '192.168.0.1', targetMac: '00:00:00:00:00:00' },
      },
      {
        no: 2, time: '0.001380',
        source: GATEWAY_MAC, destination: '00:11:22:33:44:aa',
        protocol: 'ARP', length: 42,
        info: '192.168.0.1 is at 00:aa:bb:cc:dd:01',
        arpData: { opcode: 'reply', senderIp: '192.168.0.1', senderMac: GATEWAY_MAC, targetIp: '192.168.0.14', targetMac: '00:11:22:33:44:aa', vendor: 'Cisco Systems, Inc.' },
      },
      {
        no: 3, time: '0.019200',
        source: '00:55:66:77:88:bb', destination: 'Broadcast (ff:ff:ff:ff:ff:ff)',
        protocol: 'ARP', length: 42,
        info: 'Who has 192.168.0.1? Tell 192.168.0.31',
        arpData: { opcode: 'request', senderIp: '192.168.0.31', senderMac: '00:55:66:77:88:bb', targetIp: '192.168.0.1', targetMac: '00:00:00:00:00:00' },
      },
      {
        no: 4, time: '0.020600',
        source: GATEWAY_MAC, destination: 'Broadcast (ff:ff:ff:ff:ff:ff)',
        protocol: 'ARP', length: 42,
        info: '192.168.0.1 is at 00:aa:bb:cc:dd:01',
        arpData: { opcode: 'reply', senderIp: '192.168.0.1', senderMac: GATEWAY_MAC, targetIp: '192.168.0.31', targetMac: '00:55:66:77:88:bb', vendor: 'Cisco Systems, Inc.' },
      },
      {
        no: 5, time: '0.044810',
        source: ATTACKER_MAC, destination: 'Broadcast (ff:ff:ff:ff:ff:ff)',
        protocol: 'ARP', length: 42,
        info: `192.168.0.1 is at ${ATTACKER_MAC}`,
        arpData: {
          opcode: 'gratuitous',
          senderIp: '192.168.0.1', senderMac: ATTACKER_MAC,
          targetIp: '192.168.0.1', targetMac: ATTACKER_MAC,
          vendor: `Unknown (${flagEncoded})`,
        },
      },
      {
        no: 6, time: '0.044950',
        source: ATTACKER_MAC, destination: 'Broadcast (ff:ff:ff:ff:ff:ff)',
        protocol: 'ARP', length: 42,
        info: `192.168.0.1 is at ${ATTACKER_MAC}`,
        arpData: { opcode: 'gratuitous', senderIp: '192.168.0.1', senderMac: ATTACKER_MAC, targetIp: '192.168.0.1', targetMac: ATTACKER_MAC, vendor: 'Unknown' },
      },
      {
        no: 7, time: '0.060000',
        source: '00:11:22:33:44:aa', destination: 'Broadcast (ff:ff:ff:ff:ff:ff)',
        protocol: 'ARP', length: 42,
        info: 'Who has 192.168.0.1? Tell 192.168.0.14',
        arpData: { opcode: 'request', senderIp: '192.168.0.14', senderMac: '00:11:22:33:44:aa', targetIp: '192.168.0.1', targetMac: '00:00:00:00:00:00' },
      },
      {
        no: 8, time: '0.061200',
        source: ATTACKER_MAC, destination: '00:11:22:33:44:aa',
        protocol: 'ARP', length: 42,
        info: `192.168.0.1 is at ${ATTACKER_MAC}`,
        arpData: { opcode: 'reply', senderIp: '192.168.0.1', senderMac: ATTACKER_MAC, targetIp: '192.168.0.14', targetMac: '00:11:22:33:44:aa', vendor: 'Unknown' },
      },
    ];

    return {
      packets,
      downloadUrl: `/practice-labs/wireshark/lab3/download?labId=${resolvedLabId}`,
      fileName: PCAP_FILE,
    };
  }

  async streamPcap(_userId: string, _labId: string, res: Response) {
    if (!fs.existsSync(PCAP_PATH)) {
      throw new NotFoundException('Capture file not found.');
    }
    res.setHeader('Content-Type', 'application/vnd.tcpdump.pcap');
    res.setHeader('Content-Disposition', `attachment; filename="${PCAP_FILE}"`);
    res.setHeader('Content-Length', fs.statSync(PCAP_PATH).size);
    fs.createReadStream(PCAP_PATH).pipe(res);
  }

  async getProgress(userId: string, labId: string) {
    try {
      const resolvedLabId = await this.stateService.resolveLabId(labId);
      const progress = await this.prisma.userLabProgress.findFirst({
        where: { userId, labId: resolvedLabId },
        select: { flagSubmitted: true, hintsUsed: true, startedAt: true, completedAt: true },
      });
      return {
        step: progress?.flagSubmitted ? 'COMPLETED' : 'RUNNING',
        flagSubmitted: progress?.flagSubmitted ?? false,
        hintsUsed: progress?.hintsUsed ?? 0,
        startedAt: progress?.startedAt ?? null,
        completedAt: progress?.completedAt ?? null,
      };
    } catch {
      return { step: 'RUNNING', flagSubmitted: false, hintsUsed: 0 };
    }
  }

  async submitFlag(userId: string, labId: string, submittedFlag: string) {
    if (!submittedFlag?.trim()) throw new BadRequestException('flag is required');
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const result = await this.flagRecord.verifyAndConsume(userId, resolvedLabId, 'lab3-arp-attempt', submittedFlag.trim());
    if (result === 'correct') {
      return {
        success: true, flag: submittedFlag.trim(), message: 'Access confirmed.',
        explanation:
          'ARP Spoofing: attacker sends Gratuitous ARP replies claiming gateway IP with different MAC. ' +
          'Defense: Dynamic ARP Inspection (DAI) on managed switches.',
      };
    }
    if (result === 'already_used') return { success: false, message: 'Already submitted.' };
    if (result === 'expired') return { success: false, message: 'Session expired. Restart lab.' };
    return { success: false, message: 'Incorrect flag.' };
  }
}
