// src/modules/practice-labs/xss/labs/lab5/lab5.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab5Service } from './lab5.service';

@Controller('practice-labs/xss/lab5')
@UseGuards(JwtAuthGuard)
export class Lab5Controller {
  constructor(private lab5Service: Lab5Service) {}

  // ── read-only / init ─────────────────────────────────────────────────────
  @SkipThrottle()
  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.initLab(userId, labId);
  }

  @SkipThrottle()
  @Post('webhooks')
  async getWebhooks(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab5Service.getWebhooks(userId, labId);
  }

  // ── reset ────────────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  async resetLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.initLab(userId, labId);
  }

  // ── vulnerable endpoints ──────────────────────────────────────────────────
  // Step 1: webhook name stored raw — looks safe at creation time
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('webhook')
  async createWebhook(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('name') name: string,
    @Body('endpoint') endpoint: string,
    @Body('events') events: string[],
  ) {
    return this.lab5Service.createWebhook(userId, labId, name, endpoint, events);
  }

  // Step 2: admin views activity log → Second-Order XSS triggers
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('admin/activity-log')
  async adminViewActivityLog(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab5Service.adminViewActivityLog(userId, labId);
  }
}
