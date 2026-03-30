// src/modules/practice-labs/xss/labs/lab1/lab1.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import { FlagRecordService } from '../../../shared/services/flag-record.service';
import { FlagPolicyEngine } from '../../../shared/engines/flag-policy.engine';
import { XssDetectorEngine } from '../../../shared/engines/xss-detector.engine';

const LAB_SLUG   = 'xss-asset-search-reflect';
const LAB_SECRET = 'xss_lab1_s3cr3t_assettrack_reflect_2025';
const FLAG_PREFIX = 'XSS_LAB1';

@Injectable()
export class Lab1Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
    private flagRecord: FlagRecordService,
  ) {}

  async initLab(userId: string, labId: string) {
    const state = await this.stateService.initializeState(userId, labId);
    const flag = FlagPolicyEngine.generate(userId, state.labId, LAB_SECRET, FLAG_PREFIX);
    await this.flagRecord.generateAndStore(userId, state.labId, 'attempt-1', flag);
    return state;
  }

  async search(userId: string, labId: string, query: string) {
    if (!query) throw new BadRequestException('Search query is required');

    const state = await this.stateService.resolveLabId(labId);

    const results = await this.prisma.labGenericContent.findMany({
      where: {
        userId,
        labId: state,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { body:  { contains: query, mode: 'insensitive' } },
        ],
      },
    });

    const message = `Asset '${query}' not found in inventory`;
    const detection = XssDetectorEngine.detect(query);

    if (detection.detected) {
      const flag = FlagPolicyEngine.generate(userId, state, LAB_SECRET, FLAG_PREFIX);
      return {
        success: true,
        exploited: true,
        message,
        results,
        matchedVector: detection.matchedVector,
        flag,
        simulation:
          'Your payload was reflected into the HTML response without encoding. ' +
          "In a real browser, this executes immediately in the IT admin's session context.",
      };
    }

    return { success: true, exploited: false, message, results };
  }
}
