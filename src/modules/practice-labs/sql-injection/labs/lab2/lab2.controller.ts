// src/modules/practice-labs/sql-injection/labs/lab2/lab2.controller.ts
import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards/jwt-auth.guard';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/sqli-union-extract')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private readonly lab2: Lab2Service) {}

  // ── init (legacy GET) ────────────────────────────────────────────────────
  @SkipThrottle()
  @Get('init')
  init(@GetUser('id') userId: string) {
    return this.lab2.initLab(userId, 'sqli-union-extract');
  }

  // ── start (POST alias expected by frontend useLabBase) ───────────────────
  @SkipThrottle()
  @Post('start')
  start(@GetUser('id') userId: string) {
    return this.lab2.initLab(userId, 'sqli-union-extract');
  }

  // ── reset ────────────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  reset(@GetUser('id') userId: string) {
    return this.lab2.initLab(userId, 'sqli-union-extract');
  }

  // ── progress ─────────────────────────────────────────────────────────────
  @SkipThrottle()
  @Get('progress')
  getProgress(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
  ) {
    return this.lab2.getProgress(userId, labId ?? 'sqli-union-extract');
  }

  // ── vulnerable endpoint ───────────────────────────────────────────────────
  // ❌ UNION-based SQLi: q injected directly into raw SQL query
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Get('search')
  search(@GetUser('id') userId: string, @Query('q') q: string) {
    return this.lab2.search(userId, 'sqli-union-extract', q ?? '');
  }
}
