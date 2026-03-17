// src/modules/practice-labs/broken-auth/labs/lab1/lab1.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/broken-auth/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  // ── read-only / init ─────────────────────────────────────────────────────
  @SkipThrottle()
  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  @SkipThrottle()
  @Post('auth/leaked-passwords')
  getLeakedPasswords(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab1Service.getLeakedPasswords(userId, labId);
  }

  // ── reset ────────────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  reset(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  // ── vulnerable endpoints ──────────────────────────────────────────────────
  // ❌ Broken Auth: no rate limiting or account lockout — brute-force possible
  // Intentionally higher limit to allow the student to demo the attack,
  // but still throttled to prevent actual abuse of the platform
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('auth/login')
  login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.lab1Service.login(userId, labId, email, password);
  }

  // Auto brute-force simulation — single call, internal loop
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('auth/brute-force-simulate')
  bruteForce(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('targetEmail') targetEmail: string,
  ) {
    return this.lab1Service.bruteForceSimulate(userId, labId, targetEmail);
  }
}
