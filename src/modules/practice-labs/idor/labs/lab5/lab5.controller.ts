// src/modules/practice-labs/idor/labs/lab5/lab5.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab5Service } from './lab5.service';

@Controller('practice-labs/idor/lab5')
@UseGuards(JwtAuthGuard)
export class Lab5Controller {
  constructor(private lab5Service: Lab5Service) {}

  // ── read-only / init ────────────────────────────────────────────────
  @SkipThrottle()
  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.initLab(userId, labId);
  }

  @SkipThrottle()
  @Post('my-reports')
  getMyReports(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.getMyReports(userId, labId);
  }

  // ── reset ───────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  reset(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.initLab(userId, labId);
  }

  // ── vulnerable endpoint ─────────────────────────────────────────────
  // ❌ Batch IDOR: processes array of IDs without per-item ownership check
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('reports/batch')
  batchReports(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('reportIds') reportIds: string[],
  ) {
    return this.lab5Service.batchReports(userId, labId, reportIds);
  }
}
