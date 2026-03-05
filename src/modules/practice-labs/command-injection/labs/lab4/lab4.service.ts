// src/modules/practice-labs/command-injection/labs/lab4/lab4.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import * as crypto from 'crypto';

@Injectable()
export class Lab4Service {
  private readonly imdsResponses: Record<string, string> = {
    'http://169.254.169.254/latest/meta-data/':
      'ami-id\nhostname\niam/\ninstance-id\ninstance-type\nlocal-ipv4\nplacement/\npublic-ipv4',
    'http://169.254.169.254/latest/meta-data/iam/': 'security-credentials/',
    'http://169.254.169.254/latest/meta-data/iam/security-credentials/':
      'CloudForgeRole',
    'http://169.254.169.254/latest/meta-data/iam/security-credentials/CloudForgeRole':
      JSON.stringify({
        Code: 'Success',
        Type: 'AWS-HMAC',
        AccessKeyId: 'ASIA_CLOUDFORGE_XYZ789',
        SecretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        Token: 'AQoDYXdzEJr_EXAMPLE_SESSION_TOKEN',
        Expiration: '2026-03-06T06:00:00Z',
        Flag: 'FLAG{CMDI_API_CLOUD_PROVISIONING_AWS_IMDS_IAM_THEFT}',
      }),
    'http://169.254.169.254/latest/meta-data/instance-id': 'i-0abc123def456789',
    'http://169.254.169.254/latest/meta-data/local-ipv4': '172.31.45.12',
  };

  private readonly cmdOutputs: Record<string, string> = {
    whoami: 'cloudforge-worker',
    id: 'uid=1001(cloudforge-worker) gid=1001(cloudforge-worker)',
    hostname: 'cloudforge-provisioner-prod',
    env: 'AWS_REGION=us-east-1\nCLOUDFORGE_ENV=production\nDB_SECRET=arn:aws:secretsmanager:us-east-1:123456:secret/prod/db',
    'ls /': 'app\nbin\netc\nhome\nopt\nproc\nrun\ntmp\nusr\nvar',
  };

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  async listServers(userId: string, labId: string) {
    return {
      success: true,
      servers: [
        {
          hostname: 'web-prod-01',
          region: 'us-east-1',
          size: 't3.medium',
          status: 'running',
        },
        {
          hostname: 'api-prod-02',
          region: 'us-east-1',
          size: 't3.large',
          status: 'running',
        },
        {
          hostname: 'db-prod-01',
          region: 'us-west-2',
          size: 'r5.xlarge',
          status: 'running',
        },
      ],
      note: 'POST /servers/provision to create a new server',
    };
  }

  // ❌ الثغرة: hostname يدخل في shell command
  async provision(
    userId: string,
    labId: string,
    hostname: string,
    region: string,
    size: string,
  ) {
    if (!hostname) throw new BadRequestException('hostname is required');

    const region_ = region || 'us-east-1';
    const size_ = size || 't3.micro';

    const isInjected = /[;&|`$]/.test(hostname);
    const injectedOutput = isInjected ? this.resolveInjection(hostname) : null;
    const hasFlag = injectedOutput?.includes('FLAG{') || false;

    const jobId = crypto.randomBytes(8).toString('hex');

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'CMDI',
        action: 'CLOUD_PROVISION',
        meta: { hostname, region: region_, size: size_, isInjected, hasFlag },
      },
    });

    if (isInjected) {
      return {
        success: true,
        exploited: hasFlag,
        jobId,
        simulatedCommand: `./provision.sh --hostname ${hostname} --region ${region_} --size ${size_}`,
        status: 'provisioning',
        injectedOutput,
        ...(hasFlag && {
          flag: 'FLAG{CMDI_API_CLOUD_PROVISIONING_AWS_IMDS_IAM_THEFT}',
          vulnerability:
            'Command Injection in Cloud Provisioning API — AWS IMDS Credential Theft',
          impact:
            'AWS IAM temporary credentials stolen. Attacker can use these to access S3, RDS, Lambda, and all AWS services assigned to the CloudForge IAM role.',
          exploitChain: [
            '1. Injected commands into hostname parameter',
            '2. Queried AWS IMDS at 169.254.169.254',
            '3. Retrieved IAM role name: CloudForgeRole',
            '4. Fetched temporary AWS credentials with Flag embedded',
          ],
          fix: [
            'Validate hostname: /^[a-zA-Z0-9-]+$/ — no special characters',
            'Use AWS SDK directly for provisioning — no shell scripts',
            'Enable IMDSv2 (token-required) to prevent SSRF/CMDI-based IMDS access',
            'Apply principle of least privilege to EC2 IAM role',
          ],
        }),
        hint: !hasFlag
          ? 'Injection confirmed! Try accessing AWS metadata: hostname: "web-01; curl http://169.254.169.254/latest/meta-data/iam/security-credentials/"'
          : undefined,
      };
    }

    return {
      success: true,
      jobId,
      hostname,
      region: region_,
      size: size_,
      status: 'provisioning',
      estimatedTime: '3-5 minutes',
    };
  }

  private resolveInjection(hostname: string): string {
    // محاكاة curl IMDS
    for (const [url, response] of Object.entries(this.imdsResponses)) {
      const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`curl\\s+['"]?${escapedUrl}['"]?`).test(hostname)) {
        return response;
      }
    }

    // محاكاة أوامر أخرى
    for (const [cmd, output] of Object.entries(this.cmdOutputs)) {
      if (hostname.includes(cmd)) return output;
    }

    // محاكاة generic injection
    const injectedParts = hostname.split(/[;&|`]/).slice(1);
    if (injectedParts.length) {
      return `(executed: ${injectedParts.map((c) => c.trim()).join(', ')})`;
    }

    return '';
  }
}
