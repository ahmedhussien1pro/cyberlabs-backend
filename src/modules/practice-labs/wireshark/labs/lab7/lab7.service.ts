// src/modules/practice-labs/wireshark/labs/lab7/lab7.service.ts
// LAB 7 — C2 Beacon Detection (Advanced)
// Scenario : EDR alert — periodic outbound TCP connections from workstation
// الطالب يحدد الـ beacon interval، الـ C2 IP، يعمل extract لـ beacon signature
// Flag     : FLAG{c2_ip_interval_signature}
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import { FlagRecordService } from '../../../shared/services/flag-record.service';

const FLAG_PREFIX    = 'FLAG{WIRESHARK-LAB7-C2BEACON';
const C2_IP          = '185.220.101.77';
const VICTIM_IP      = '10.10.0.23';
const BEACON_INTERVAL = 60; // seconds
const BEACON_SIG     = 'X-Beacon-ID: c2client-v2';

@Injectable()
export class Lab7Service {
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
      'lab7-c2-attempt',
      result.dynamicFlag,
      24,
    );
    return { status: 'success', message: 'C2 Beacon Detection lab initialized', labId: result.labId };
  }

  async getCapture(userId: string, labId: string) {
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const dynamicFlag   = this.stateService.generateDynamicFlag(FLAG_PREFIX, userId, resolvedLabId);

    // Generate beacon packets at 60-second intervals
    const beaconTimes = [30, 90, 150, 210, 270];
    const beaconPackets = beaconTimes.map((t, i) => ({
      no:          10 + i * 2,
      time:        `${t}.000000`,
      srcIp:       VICTIM_IP,
      dstIp:       C2_IP,
      source:      VICTIM_IP,
      destination: C2_IP,
      protocol:    'TCP',
      length:      74,
      info:        `49${200 + i} → 4444 [SYN]`,
      flags:       'SYN',
      c2Data: {
        beacon:    true,
        dstIp:     C2_IP,
        dstPort:   4444,
        interval:  BEACON_INTERVAL,
        signature: BEACON_SIG,
        note:      i === 2
          ? `Beacon body: ${BEACON_SIG} — Flag: ${dynamicFlag}`
          : `Periodic beacon to C2 server. Interval: ${BEACON_INTERVAL}s`,
        flag:      i === 2 ? dynamicFlag : undefined,
      },
    }));

    const synAckPackets = beaconTimes.map((t, i) => ({
      no:          11 + i * 2,
      time:        `${t}.001200`,
      srcIp:       C2_IP,
      dstIp:       VICTIM_IP,
      source:      C2_IP,
      destination: VICTIM_IP,
      protocol:    'TCP',
      length:      74,
      info:        `4444 → 49${200 + i} [SYN, ACK]`,
      flags:       'SYN,ACK',
      c2Data:      { beacon: false },
    }));

    // Normal mixed traffic
    const normalPackets = [
      { no: 1,  time: '0.000000', srcIp: VICTIM_IP, dstIp: '8.8.8.8',          source: VICTIM_IP, destination: '8.8.8.8',          protocol: 'DNS', length: 70,  info: 'Standard query A microsoft.com' },
      { no: 2,  time: '0.010000', srcIp: '8.8.8.8', dstIp: VICTIM_IP,          source: '8.8.8.8', destination: VICTIM_IP,          protocol: 'DNS', length: 86,  info: 'Standard query response A 20.112.250.133' },
      { no: 3,  time: '5.000000', srcIp: VICTIM_IP, dstIp: '20.112.250.133',   source: VICTIM_IP, destination: '20.112.250.133',   protocol: 'TCP', length: 74,  info: '55100 → 443 [SYN]', flags: 'SYN' },
      { no: 4,  time: '15.000000', srcIp: VICTIM_IP, dstIp: '142.250.185.78', source: VICTIM_IP, destination: '142.250.185.78',  protocol: 'HTTP', length: 310, info: 'GET /search?q=wireshark HTTP/1.1',
        httpData: { method: 'GET', uri: '/search?q=wireshark', sqli: false } },
      { no: 5,  time: '15.100000', srcIp: '142.250.185.78', dstIp: VICTIM_IP, source: '142.250.185.78', destination: VICTIM_IP, protocol: 'HTTP', length: 2048, info: 'HTTP/1.1 200 OK',
        httpData: { method: null, statusCode: 200 } },
    ];

    // Interleave normal + beacon packets sorted by no
    const allPackets = [...normalPackets, ...beaconPackets, ...synAckPackets]
      .sort((a, b) => a.no - b.no);

    return {
      packets:        allPackets,
      beaconInterval: BEACON_INTERVAL,
      c2Ip:           C2_IP,
      hint:           `Look for repeated SYN packets from ${VICTIM_IP} to the same external IP every ${BEACON_INTERVAL}s`,
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
      'lab7-c2-attempt',
      submittedFlag.trim(),
    );

    if (result === 'correct') {
      return {
        success:     true,
        flag:        submittedFlag.trim(),
        message:     'Outstanding! You detected the C2 beacon communication pattern.',
        explanation: `C2 beaconing uses periodic outbound connections to blend with normal traffic. ` +
          `This sample used a ${BEACON_INTERVAL}s interval to ${C2_IP}:4444. ` +
          `Defenders detect beacons via jitter analysis, long-connection detection, ` +
          `and anomalous port usage (4444 = common Metasploit default). ` +
          `Tools: Zeek, Suricata, EDR telemetry, RITA.`,
      };
    }
    if (result === 'already_used') return { success: false, message: 'Flag already submitted. Lab is solved!' };
    if (result === 'expired')      return { success: false, message: 'Session expired. Please restart the lab.' };

    return {
      success: false,
      message: `Incorrect. Filter TCP, find 5 SYN packets from ${VICTIM_IP} to ${C2_IP}:4444 every ${BEACON_INTERVAL}s. Expand packet #12 body to get the signature.`,
    };
  }
}
