// src/modules/practice-labs/xss/labs/lab2/lab2.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/xss/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  // ── read-only / init ─────────────────────────────────────────────────────
  @SkipThrottle()
  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  @SkipThrottle()
  @Post('reviews')
  async getReviews(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab2Service.getReviews(userId, labId);
  }

  // ── reset ────────────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  async resetLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  // ── vulnerable endpoints ──────────────────────────────────────────────────
  // Step 1: submit review — stored raw without sanitization
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('review')
  async submitReview(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('content') content: string,
    @Body('rating') rating: number,
  ) {
    return this.lab2Service.submitReview(userId, labId, content, rating);
  }

  // Step 2: admin moderation — triggers stored XSS in admin context
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('admin/moderate')
  async adminModerate(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab2Service.adminModerate(userId, labId);
  }
}
