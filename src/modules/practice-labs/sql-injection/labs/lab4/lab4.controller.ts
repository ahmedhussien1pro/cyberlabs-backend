// src/modules/practice-labs/sql-injection/labs/lab4/lab4.controller.ts
import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards/jwt-auth.guard';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab4Service } from './lab4.service';

@Controller('practice-labs/sqli-error-based')
@UseGuards(JwtAuthGuard)
export class Lab4Controller {
  constructor(private readonly lab4: Lab4Service) {}

  // ── read-only / init ─────────────────────────────────────────────────────
  @SkipThrottle()
  @Get('init')
  init(@GetUser('id') userId: string) {
    return this.lab4.initLab(userId, 'sqli-error-based');
  }

  // ── reset ────────────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  reset(@GetUser('id') userId: string) {
    return this.lab4.initLab(userId, 'sqli-error-based');
  }

  // ── vulnerable endpoint ───────────────────────────────────────────────────
  // ❌ Error-based SQLi: id injected into raw SQL — DB errors leaked in response
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Get('user')
  lookupUser(@GetUser('id') userId: string, @Query('id') id: string) {
    return this.lab4.lookupUser(userId, 'sqli-error-based', id ?? '1');
  }
}
