// src/modules/practice-labs/services/lab-launch.service.ts
// Responsible for: lab instance lifecycle — launch token generation & consumption
// Extracted from PracticeLabsService (God Service refactor — PR #1)

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../../core/database';
import { PracticeLabStateService } from '../shared/services/practice-lab-state.service';
import { FlagRecordService } from '../shared/services/flag-record.service';
import { FlagPolicyType, LabLaunchInfo } from '../types/lab.types';

@Injectable()
export class LabLaunchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly stateService: PracticeLabStateService,
    private readonly flagRecord: FlagRecordService,
  ) {}

  // ─────────────────────────────────────────────
  // POST /practice-labs/:labId/launch
  // ─────────────────────────────────────────────
  async launchLab(labId: string, userId: string) {
    const lab = (await this.prisma.lab.findUnique({
      where: { id: labId, isPublished: true },
    })) as LabLaunchInfo | null;

    if (!lab) throw new NotFoundException('Lab not found');

    await this.prisma.labLaunchToken.updateMany({
      where: { userId, labId, usedAt: null },
      data: { expiresAt: new Date(0) },
    });

    const instance = await this.prisma.labInstance.upsert({
      where: { userId_labId: { userId, labId } },
      update: { isActive: true, startedAt: new Date() },
      create: { userId, labId, isActive: true },
    });

    await this.prisma.userLabProgress.upsert({
      where: { userId_labId: { userId, labId } },
      update: { lastAccess: new Date(), attempts: { increment: 1 } },
      create: {
        userId,
        labId,
        attempts: 1,
        startedAt: new Date(),
        lastAccess: new Date(),
      },
    });

    const ttlMinutes =
      this.configService.get<number>('labs.launchTokenTTLMinutes') ?? 60;
    const tokenStr = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.prisma.labLaunchToken.create({
      data: {
        token: tokenStr,
        userId,
        labId,
        instanceId: instance.id,
        expiresAt,
      },
    });

    const flagPolicy: FlagPolicyType = lab.flagPolicyType ?? 'PER_USER_PER_LAB';
    if (flagPolicy === 'PER_USER_PER_ATTEMPT' || flagPolicy === 'PER_SESSION') {
      const dynamicFlag = this.stateService.generateDynamicFlag(
        `FLAG{${lab.slug.toUpperCase().replace(/-/g, '_')}`,
        userId,
        instance.id,
      );
      await this.flagRecord.generateAndStore(
        userId,
        labId,
        instance.id,
        dynamicFlag,
      );
    }

    const labsUrl =
      this.configService.get<string>('labs.labsUrl') ??
      'https://www.labs.cyber-labs.tech';

    return {
      success: true,
      launchUrl: `${labsUrl}/launch/${tokenStr}`,
      instanceId: instance.id,
      executionMode: lab.executionMode,
      environmentType: lab.environmentType ?? 'DEFAULT',
      tokenExpiresAt: expiresAt.toISOString(),
      tokenTTLMinutes: ttlMinutes,
    };
  }

  // ─────────────────────────────────────────────
  // POST /practice-labs/launch/consume
  // ─────────────────────────────────────────────
  async consumeToken(token: string, userId: string) {
    const launchToken = await this.prisma.labLaunchToken.findFirst({
      where: { token, usedAt: null, expiresAt: { gt: new Date() }, userId },
    });

    if (!launchToken) {
      throw new BadRequestException('Token invalid, expired, or already used');
    }

    await this.prisma.labLaunchToken.update({
      where: { id: launchToken.id },
      data: { usedAt: new Date() },
    });

    // ✅ NO solution / postSolve / scenarioAdmin — admin-only fields excluded
    const lab = await this.prisma.lab.findUnique({
      where: { id: launchToken.labId },
      select: {
        id: true,
        slug: true,
        title: true,
        ar_title: true,
        description: true,
        ar_description: true,
        scenario: true,
        ar_scenario: true,
        goal: true,
        ar_goal: true,
        briefing: true,
        stepsOverview: true,
        executionMode: true,
        environmentType: true,
        engineConfig: true,
        initialState: true,
        difficulty: true,
        category: true,
        skills: true,
        xpReward: true,
        pointsReward: true,
        duration: true,
        missionBrief: true,
        labInfo: true,
        immersiveAssets: true,
        hintPenaltyMode: true,
        flagPolicyType: true,
        hints: {
          select: { id: true, order: true, xpCost: true, penaltyPercent: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!lab) throw new NotFoundException('Lab not found');

    return {
      success: true,
      labId: launchToken.labId,
      instanceId: launchToken.instanceId,
      lab,
    };
  }
}
