// src/modules/practice-labs/sql-injection/labs/lab5/lab5.controller.ts
import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards/jwt-auth.guard';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab5Service } from './lab5.service';

@Controller('practice-labs/sql-injection/lab5')
@UseGuards(JwtAuthGuard)
export class Lab5Controller {
  constructor(private readonly lab5: Lab5Service) {}

  // ── init (legacy GET) ────────────────────────────────────────────────────
  @SkipThrottle()
  @Get('init')
  init(@GetUser('id') userId: string) {
    return this.lab5.initLab(userId, 'sqli-time-based');
  }

  // ── start (POST alias expected by frontend useLabBase) ───────────────────
  @SkipThrottle()
  @Post('start')
  start(@GetUser('id') userId: string) {
    return this.lab5.initLab(userId, 'sqli-time-based');
  }

  // ── reset ────────────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  reset(@GetUser('id') userId: string) {
    return this.lab5.initLab(userId, 'sqli-time-based');
  }

  // ── progress ─────────────────────────────────────────────────────────────
  @SkipThrottle()
  @Get('progress')
  getProgress(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
  ) {
    return this.lab5.getProgress(userId, labId ?? 'sqli-time-based');
  }

  // ── vulnerable endpoint ───────────────────────────────────────────────────
  // ❌ Time-based blind SQLi: id causes DB sleep when payload is true
  // Higher limit — time-based extraction needs many sequential requests
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Get('account')
  lookupAccount(@GetUser('id') userId: string, @Query('id') id: string) {
    return this.lab5.lookupAccount(userId, 'sqli-time-based', id ?? '1');
  }
}
