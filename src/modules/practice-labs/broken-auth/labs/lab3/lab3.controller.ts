// src/modules/practice-labs/broken-auth/labs/lab3/lab3.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/broken-auth/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  // ── read-only / init ────────────────────────────────────────────────
  @SkipThrottle()
  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  @SkipThrottle()
  @Post('analytics/logs')
  getAnalyticsLogs(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab3Service.getAnalyticsLogs(userId, labId);
  }

  // ── reset ───────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  reset(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  // ── vulnerable endpoints ────────────────────────────────────────────
  // Token sent in URL → leaks via Referer header to analytics
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('auth/request-reset')
  requestReset(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('email') email: string,
  ) {
    return this.lab3Service.requestReset(userId, labId, email);
  }

  // Simulate victim visiting reset page → token leaks to analytics
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('auth/simulate-page-visit')
  simulatePageVisit(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('resetUrl') resetUrl: string,
  ) {
    return this.lab3Service.simulatePageVisit(userId, labId, resetUrl);
  }

  // ❌ Accepts token from URL without context check
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('auth/do-reset')
  doReset(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.lab3Service.doReset(userId, labId, token, newPassword);
  }
}
