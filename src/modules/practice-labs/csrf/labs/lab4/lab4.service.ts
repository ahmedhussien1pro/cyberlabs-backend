// src/modules/practice-labs/csrf/labs/lab4/lab4.service.ts
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class Lab4Service {
  private deployHistory: any[] = [];

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    this.deployHistory = [];
    return this.stateService.initializeState(userId, labId);
  }

  async listBuilds(userId: string, labId: string) {
    const builds = await this.prisma.labGenericContent.findMany({
      where: { userId, labId, author: 'build' },
    });

    return {
      success: true,
      builds: builds.map((b) => ({ buildId: b.title, ...JSON.parse(b.body) })),
      corsInfo: {
        policy: 'Access-Control-Allow-Origin: *.pipelinehub.io',
        credentials: true,
        note: 'The API trusts ALL subdomains of pipelinehub.io with credentials.',
      },
    };
  }

  async getDeployHistory(userId: string, labId: string) {
    return {
      success: true,
      deployments: this.deployHistory,
    };
  }

  // ❌ الثغرة: CORS wildcard subdomain + بدون CSRF token
  async deploy(
    userId: string,
    labId: string,
    buildId: string,
    environment: string,
    origin?: string,
  ) {
    if (!buildId || !environment) {
      throw new BadRequestException('buildId and environment are required');
    }

    // ❌ الثغرة: يثق في أي subdomain
    const isTrustedOrigin =
      !origin ||
      origin.endsWith('.pipelinehub.io') ||
      origin === 'https://app.pipelinehub.io';

    if (!isTrustedOrigin) {
      throw new ForbiddenException('Origin not allowed');
    }

    const build = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, title: buildId },
    });

    if (!build) throw new BadRequestException('Build not found');

    const buildData = JSON.parse(build.body);

    const deployment = {
      deploymentId: `DEP-${Date.now()}`,
      buildId,
      environment,
      triggeredFrom: origin || 'direct',
      timestamp: new Date().toISOString(),
      status: 'DEPLOYED',
      isMalicious: !buildData.safe,
    };

    this.deployHistory.push(deployment);

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'CSRF',
        action: 'CICD_DEPLOY',
        meta: { ...deployment, buildData },
      },
    });

    const isExploited =
      !buildData.safe &&
      origin?.endsWith('.pipelinehub.io') &&
      origin !== 'https://app.pipelinehub.io';

    if (isExploited) {
      return {
        success: true,
        exploited: true,
        deployment,
        build: buildData,
        flag: 'FLAG{CSRF_CORS_WILDCARD_SUBDOMAIN_CICD_DEPLOY_BACKDOOR}',
        vulnerability: 'CSRF + CORS Wildcard Subdomain Misconfiguration',
        exploitChain: [
          '1. Attacker controls docs.pipelinehub.io (trusted by wildcard CORS)',
          '2. CORS trusts the subdomain + allows credentials',
          '3. No CSRF token on /deploy endpoint',
          '4. Backdoored build deployed to production',
        ],
        impact:
          'Malicious build with reverse shell deployed to production. Full server compromise.',
        fix: [
          'Use explicit CORS whitelist instead of wildcard subdomains',
          'Implement CSRF tokens on all state-changing API endpoints',
          'Require re-authentication for production deployments',
          'Implement deployment approval workflow',
        ],
      };
    }

    return {
      success: true,
      deployment,
      message: `Build ${buildId} deployed to ${environment}`,
    };
  }

  async simulateSubdomainRequest(
    userId: string,
    labId: string,
    origin: string,
    buildId: string,
    environment: string,
  ) {
    if (!origin?.endsWith('.pipelinehub.io')) {
      throw new BadRequestException(
        'Simulate with a *.pipelinehub.io origin to bypass CORS',
      );
    }
    return this.deploy(userId, labId, buildId, environment, origin);
  }
}
