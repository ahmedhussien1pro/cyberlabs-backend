// src/modules/practice-labs/command-injection/labs/lab1/lab1.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab1Service {
  // محاكاة نتائج الأوامر
  private readonly commandOutputs: Record<string, string> = {
    whoami: 'www-data',
    id: 'uid=33(www-data) gid=33(www-data) groups=33(www-data)',
    hostname: 'netops-server-prod-01',
    uname: 'Linux netops-server-prod-01 5.15.0-1034-aws',
    pwd: '/var/www/netops',
    'ls /':
      'bin\nboot\netc\nhome\nlib\nopt\nproc\nroot\nrun\nsrv\ntmp\nusr\nvar',
    'ls /etc': 'flag.txt\nhosts\npasswd\nshadow\nnetworks\nresolv.conf',
    'cat /etc/flag.txt': 'FLAG{CMDI_BASIC_PING_SHELL_OPERATOR_INJECTION}',
    'cat /etc/passwd':
      'root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin',
    ifconfig: 'eth0: inet 172.31.45.12  netmask 255.255.255.0',
    env: 'PATH=/usr/local/sbin:/usr/local/bin\nHOME=/var/www\nDB_PASS=prod_db_s3cr3t!\nAPI_KEY=sk_prod_netops_xyz',
  };

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async getInfo(userId: string, labId: string) {
    return {
      success: true,
      tool: 'NetOps Network Diagnostic Tool v2.1',
      features: ['ping', 'traceroute', 'nslookup'],
      usage: 'POST /network/ping with { "host": "hostname_or_ip" }',
      note: 'Enter a hostname or IP address to ping.',
    };
  }

  // ❌ الثغرة: يحاكي shell command injection
  async ping(userId: string, labId: string, host: string) {
    if (!host) throw new BadRequestException('host is required');

    // محاكاة تنفيذ: ping -c 1 <host>
    const pingOutput = this.simulatePing(host);
    const injectedOutput = this.simulateInjection(host);

    const isInjected = this.detectInjection(host);

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'CMDI',
        action: 'PING',
        meta: {
          host,
          isInjected,
          injectedCommands: this.extractInjectedCommands(host),
        },
      },
    });

    if (isInjected && injectedOutput) {
      const hasFlag = injectedOutput.includes('FLAG{');

      return {
        success: true,
        exploited: hasFlag,
        command: `ping -c 1 ${host}`,
        output: pingOutput + '\n' + injectedOutput,
        ...(hasFlag && {
          flag: 'FLAG{CMDI_BASIC_PING_SHELL_OPERATOR_INJECTION}',
          vulnerability:
            'OS Command Injection — Unsanitized Input in Shell Command',
          impact:
            'Full server command execution. Attacker can read files, environment variables, pivot to internal network.',
          fix: [
            'Never pass user input directly to shell commands',
            'Use language-native libraries: use net.ping() instead of exec("ping...")',
            'If shell is necessary, whitelist valid inputs (IP regex only)',
            'Use execFile() with argument array instead of exec() with string',
          ],
        }),
        injectedCommands: this.extractInjectedCommands(host),
      };
    }

    return {
      success: true,
      exploited: false,
      command: `ping -c 1 ${host}`,
      output: pingOutput,
    };
  }

  private simulatePing(host: string): string {
    const cleanHost = host.split(/[;&|`$]/, 1)[0].trim();
    return `PING ${cleanHost} (${cleanHost}): 56 data bytes\n64 bytes from ${cleanHost}: icmp_seq=0 ttl=64 time=0.045 ms\n--- ${cleanHost} ping statistics ---\n1 packets transmitted, 1 received, 0% packet loss`;
  }

  private simulateInjection(host: string): string {
    const injected = this.extractInjectedCommands(host);
    return injected
      .map(
        (cmd) =>
          this.commandOutputs[cmd.trim()] ||
          `sh: ${cmd.trim()}: simulated output`,
      )
      .join('\n');
  }

  private detectInjection(host: string): boolean {
    return /[;&|`$]/.test(host);
  }

  private extractInjectedCommands(host: string): string[] {
    const parts = host.split(/[;&|`]/);
    return parts
      .slice(1)
      .map((c) => c.trim())
      .filter(Boolean);
  }
}
