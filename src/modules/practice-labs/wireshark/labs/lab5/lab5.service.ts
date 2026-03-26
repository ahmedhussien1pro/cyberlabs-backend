// src/modules/practice-labs/wireshark/labs/lab5/lab5.service.ts
// LAB 5 — Stolen Flag via DNS Exfiltration (Hard)
// Scenario : Malware سرب data عبر DNS queries (DNS Tunneling)
// الطالب يفلتر DNS، يلاقي الـ suspicious subdomain، يعمل base64 decode
// Flag     : الـ decoded secret من الـ DNS query
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import { FlagRecordService } from '../../../shared/services/flag-record.service';

const FLAG_PREFIX = 'FLAG{WIRESHARK-LAB5-DNS-EXFIL';

@Injectable()
export class Lab5Service {
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
      'lab5-dns-attempt',
      result.dynamicFlag,
      24,
    );
    return { status: 'success', message: 'DNS Exfiltration lab initialized', labId: result.labId };
  }

  async getCapture(userId: string, labId: string) {
    const resolvedLabId = await this.stateService.resolveLabId(labId);
    const dynamicFlag   = this.stateService.generateDynamicFlag(FLAG_PREFIX, userId, resolvedLabId);

    // ─── نعمل base64 encode للـ flag عشان الطالب يعمل decode ──────────────
    // الـ flag بيتقسم على 2 DNS queries زي الـ real DNS tunneling
    const flagPart1 = Buffer.from(dynamicFlag.slice(0, Math.ceil(dynamicFlag.length / 2))).toString('base64').replace(/=/g, '');
    const flagPart2 = Buffer.from(dynamicFlag.slice(Math.ceil(dynamicFlag.length / 2))).toString('base64').replace(/=/g, '');

    // ─── Mock DNS Packet Capture ──────────────────────────────────────────
    const packets = [
      // Normal DNS traffic
      { no: 1,  time: '0.000000', source: '10.0.0.15', destination: '8.8.8.8', protocol: 'DNS', length: 70,
        info: 'Standard query A google.com',
        dnsData: { type: 'query', qtype: 'A', query: 'google.com', suspicious: false } },
      { no: 2,  time: '0.010000', source: '8.8.8.8',   destination: '10.0.0.15', protocol: 'DNS', length: 86,
        info: 'Standard query response A 142.250.185.78',
        dnsData: { type: 'response', query: 'google.com', answer: '142.250.185.78', suspicious: false } },
      { no: 3,  time: '0.020000', source: '10.0.0.15', destination: '8.8.8.8', protocol: 'DNS', length: 70,
        info: 'Standard query A github.com',
        dnsData: { type: 'query', qtype: 'A', query: 'github.com', suspicious: false } },
      { no: 4,  time: '0.030000', source: '8.8.8.8',   destination: '10.0.0.15', protocol: 'DNS', length: 86,
        info: 'Standard query response A 140.82.121.4',
        dnsData: { type: 'response', query: 'github.com', answer: '140.82.121.4', suspicious: false } },
      // Normal HTTP traffic
      { no: 5,  time: '0.050000', source: '10.0.0.15', destination: '142.250.185.78', protocol: 'TCP', length: 74,
        info: '55432 → 443 [SYN]', flags: 'SYN' },
      { no: 6,  time: '0.051000', source: '10.0.0.7',  destination: '8.8.8.8', protocol: 'DNS', length: 70,
        info: 'Standard query A api.stripe.com',
        dnsData: { type: 'query', qtype: 'A', query: 'api.stripe.com', suspicious: false } },
      // ⚠️  SUSPICIOUS: DNS Tunneling — base64 payload in subdomain
      { no: 7,  time: '1.200000', source: '10.0.0.22', destination: '185.220.101.5', protocol: 'DNS', length: 142,
        info: `Suspicious query TXT ${flagPart1}.exfil.evil-c2.net`,
        dnsData: {
          type:       'query',
          qtype:      'TXT',
          query:      `${flagPart1}.exfil.evil-c2.net`,
          suspicious: true,
          note:       'Unusually long subdomain — possible data exfiltration via DNS. Decode the subdomain!',
        },
      },
      { no: 8,  time: '1.201500', source: '185.220.101.5', destination: '10.0.0.22', protocol: 'DNS', length: 100,
        info: `Suspicious query response TXT ${flagPart1}.exfil.evil-c2.net`,
        dnsData: { type: 'response', query: `${flagPart1}.exfil.evil-c2.net`, answer: 'ok', suspicious: true } },
      { no: 9,  time: '1.203000', source: '10.0.0.22', destination: '185.220.101.5', protocol: 'DNS', length: 138,
        info: `Suspicious query TXT ${flagPart2}.exfil.evil-c2.net`,
        dnsData: {
          type:       'query',
          qtype:      'TXT',
          query:      `${flagPart2}.exfil.evil-c2.net`,
          suspicious: true,
          note:       'Second chunk — decode both subdomains and combine to get the full flag.',
        },
      },
      { no: 10, time: '1.204500', source: '185.220.101.5', destination: '10.0.0.22', protocol: 'DNS', length: 100,
        info: `Suspicious query response TXT ${flagPart2}.exfil.evil-c2.net`,
        dnsData: { type: 'response', query: `${flagPart2}.exfil.evil-c2.net`, answer: 'ok', suspicious: true } },
      // More normal traffic after exfil
      { no: 11, time: '2.000000', source: '10.0.0.5',  destination: '8.8.8.8', protocol: 'DNS', length: 70,
        info: 'Standard query A cloudflare.com',
        dnsData: { type: 'query', qtype: 'A', query: 'cloudflare.com', suspicious: false } },
      { no: 12, time: '2.010000', source: '8.8.8.8',   destination: '10.0.0.5', protocol: 'DNS', length: 86,
        info: 'Standard query response A 104.16.132.229',
        dnsData: { type: 'response', query: 'cloudflare.com', answer: '104.16.132.229', suspicious: false } },
    ];

    return {
      packets,
      challenge: {
        description: 'Find the 2 suspicious DNS queries. Decode the base64 subdomains and combine them to get the flag.',
        part1Encoded: flagPart1,
        part2Encoded: flagPart2,
      },
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
      'lab5-dns-attempt',
      submittedFlag.trim(),
    );

    if (result === 'correct') {
      return {
        success:     true,
        flag:        submittedFlag.trim(),
        message:     'Outstanding! You detected and decoded the DNS exfiltration.',
        explanation: 'DNS Tunneling encodes data in DNS query subdomains to bypass firewalls. ' +
          'Defenders detect it by monitoring unusually long/encoded subdomains, high DNS query rates, ' +
          'and queries to unknown external resolvers. Tools: dnstop, PassiveDNS, Zeek.',
      };
    }
    if (result === 'already_used') return { success: false, message: 'Flag already submitted. Lab is solved!' };
    if (result === 'expired')      return { success: false, message: 'Session expired. Please restart the lab.' };

    return {
      success: false,
      message: 'Incorrect. Filter DNS, find the TXT queries to evil-c2.net, decode the base64 subdomains.',
    };
  }
}
