// src/modules/practice-labs/idor/labs/lab3/lab3.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/idor/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  // ── read-only / init ────────────────────────────────────────────────
  @SkipThrottle()
  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  // ── reset ───────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  reset(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  // ── vulnerable endpoints ────────────────────────────────────────────
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('auth/request-reset')
  requestReset(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.requestReset(userId, labId);
  }

  @SkipThrottle()
  @Post('auth/get-token')
  getToken(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.getToken(userId, labId);
  }

  // ❌ IDOR: accepts targetUserId from body — can reset any user's password
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('auth/reset-password')
  resetPassword(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('token') token: string,
    @Body('targetUserId') targetUserId: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.lab3Service.resetPassword(userId, labId, token, targetUserId, newPassword);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('auth/login')
  login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    return this.lab3Service.login(userId, labId, username, password);
  }
}
