// src/modules/practice-labs/sql-injection/labs/lab3/lab3.controller.ts
import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards/jwt-auth.guard';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/sqli-blind-boolean')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private readonly lab3: Lab3Service) {}

  // ── read-only / init ─────────────────────────────────────────────────────
  @SkipThrottle()
  @Get('init')
  init(@GetUser('id') userId: string) {
    return this.lab3.initLab(userId, 'sqli-blind-boolean');
  }

  // ── reset ────────────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  reset(@GetUser('id') userId: string) {
    return this.lab3.initLab(userId, 'sqli-blind-boolean');
  }

  // ── vulnerable endpoint ───────────────────────────────────────────────────
  // ❌ Blind Boolean SQLi: id injected into raw SQL — true/false response only
  // Higher limit because blind SQLi requires many requests by design
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Get('article')
  getArticle(@GetUser('id') userId: string, @Query('id') id: string) {
    return this.lab3.getArticle(userId, 'sqli-blind-boolean', id ?? '5');
  }
}
