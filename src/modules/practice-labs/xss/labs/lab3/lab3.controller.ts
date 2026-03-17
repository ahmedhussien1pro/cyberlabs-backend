// src/modules/practice-labs/xss/labs/lab3/lab3.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/xss/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  // ── read-only / init ─────────────────────────────────────────────────────
  @SkipThrottle()
  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  // ── reset ────────────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  async resetLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  // ── vulnerable endpoints ──────────────────────────────────────────────────
  // ❌ DOM XSS: msg returned raw → frontend sets innerHTML
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('dashboard')
  async getDashboard(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('msg') msg: string,
  ) {
    return this.lab3Service.getDashboard(userId, labId, msg);
  }

  // Verify crafted URL contains valid DOM XSS payload
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('verify')
  async verifyPayload(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('craftedUrl') craftedUrl: string,
  ) {
    return this.lab3Service.verifyPayload(userId, labId, craftedUrl);
  }
}
