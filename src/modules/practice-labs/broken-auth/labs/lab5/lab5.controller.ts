// src/modules/practice-labs/broken-auth/labs/lab5/lab5.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab5Service } from './lab5.service';

@Controller('practice-labs/broken-auth/lab5')
@UseGuards(JwtAuthGuard)
export class Lab5Controller {
  constructor(private lab5Service: Lab5Service) {}

  // ── read-only / init ────────────────────────────────────────────────
  @SkipThrottle()
  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.initLab(userId, labId);
  }

  // ── reset ───────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  reset(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.initLab(userId, labId);
  }

  // ── vulnerable endpoints ────────────────────────────────────────────
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('auth/login')
  login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.lab5Service.labLogin(userId, labId, email, password);
  }

  // ❌ OTP check without atomic operation → race condition possible
  // Higher limit: race-condition demo requires concurrent requests
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('auth/verify-otp')
  verifyOtp(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('sessionId') sessionId: string,
    @Body('otp') otp: string,
  ) {
    return this.lab5Service.verifyOtp(userId, labId, sessionId, otp);
  }

  // Auto race simulation — single call that fans out internally
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('auth/race-otp-attack')
  raceOtpAttack(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('sessionId') sessionId: string,
    @Body('otpGuesses') otpGuesses: string[],
  ) {
    return this.lab5Service.raceOtpAttack(userId, labId, sessionId, otpGuesses);
  }

  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('banking/dashboard')
  bankingDashboard(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('accessToken') accessToken: string,
  ) {
    return this.lab5Service.bankingDashboard(userId, labId, accessToken);
  }
}
