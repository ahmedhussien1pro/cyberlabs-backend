// src/modules/practice-labs/csrf/labs/lab5/lab5.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab5Service } from './lab5.service';

@Controller('practice-labs/csrf/lab5')
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
  @Post('profile/view')
  viewProfile(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.viewProfile(userId, labId);
  }

  @SkipThrottle()
  @Post('csrf/get-my-token')
  getMyToken(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.getMyToken(userId, labId);
  }

  // ── reset ───────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  reset(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.initLab(userId, labId);
  }

  // ── vulnerable endpoints ────────────────────────────────────────────
  // Token prediction helper
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('csrf/predict-token')
  predictToken(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('targetUserId') targetUserId: string,
  ) {
    return this.lab5Service.predictToken(userId, labId, targetUserId);
  }

  // ❌ CSRF token exists but is predictable (based on userId + timestamp)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('profile/update')
  updateProfile(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('csrfToken') csrfToken: string,
    @Body('targetCitizenId') targetCitizenId: string,
    @Body('newAddress') newAddress: string,
    @Body('newPhone') newPhone: string,
  ) {
    return this.lab5Service.updateProfile(userId, labId, csrfToken, targetCitizenId, newAddress, newPhone);
  }
}
