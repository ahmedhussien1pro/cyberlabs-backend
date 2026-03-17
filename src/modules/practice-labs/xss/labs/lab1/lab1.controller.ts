// src/modules/practice-labs/xss/labs/lab1/lab1.controller.ts
import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/xss/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  // ── read-only ────────────────────────────────────────────────────────────
  @SkipThrottle()
  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  @SkipThrottle()
  @Get('progress')
  async getProgress(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
  ) {
    return this.lab1Service.initLab(userId, labId);
  }

  // ── reset ────────────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  async resetLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  // ── vulnerable endpoint ──────────────────────────────────────────────────
  // ❌ Reflected XSS: query reflected raw without HTML encoding
  // Throttled to slow down automated payload scanning
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('search')
  async search(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('query') query: string,
  ) {
    return this.lab1Service.search(userId, labId, query);
  }
}
