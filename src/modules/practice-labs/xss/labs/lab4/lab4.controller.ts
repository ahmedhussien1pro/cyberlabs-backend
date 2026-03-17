// src/modules/practice-labs/xss/labs/lab4/lab4.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab4Service } from './lab4.service';

@Controller('practice-labs/xss/lab4')
@UseGuards(JwtAuthGuard)
export class Lab4Controller {
  constructor(private lab4Service: Lab4Service) {}

  // ── read-only / init ─────────────────────────────────────────────────────
  @SkipThrottle()
  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.initLab(userId, labId);
  }

  @SkipThrottle()
  @Post('profile')
  async getProfile(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab4Service.getProfile(userId, labId);
  }

  // ── reset ────────────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  async resetLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.initLab(userId, labId);
  }

  // ── vulnerable endpoints ──────────────────────────────────────────────────
  // Step 1: bio stored raw — Markdown parser will pass inline HTML as-is
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('profile/bio')
  async updateBio(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('bio') bio: string,
  ) {
    return this.lab4Service.updateBio(userId, labId, bio);
  }

  // Step 2: Admin opens profile review → XSS fires via marked.js + innerHTML
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('admin/review-profile')
  async adminReviewProfile(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab4Service.adminReviewProfile(userId, labId);
  }
}
