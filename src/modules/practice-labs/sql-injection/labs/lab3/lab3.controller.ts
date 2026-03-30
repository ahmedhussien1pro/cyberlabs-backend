// src/modules/practice-labs/sql-injection/labs/lab3/lab3.controller.ts
import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards/jwt-auth.guard';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/sql-injection/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private readonly lab3: Lab3Service) {}

  @SkipThrottle()
  @Get('init')
  init(@GetUser('id') userId: string) {
    return this.lab3.initLab(userId, 'sqli-blind-boolean');
  }

  @SkipThrottle()
  @Post('start')
  start(@GetUser('id') userId: string) {
    return this.lab3.initLab(userId, 'sqli-blind-boolean');
  }

  // ── reset: wipes DB steps ─────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  reset(@GetUser('id') userId: string) {
    return this.lab3.resetLab(userId, 'sqli-blind-boolean');
  }

  @SkipThrottle()
  @Get('progress')
  getProgress(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
  ) {
    return this.lab3.getProgress(userId, labId ?? 'sqli-blind-boolean');
  }

  // Higher throttle limit — blind SQLi requires many probes by nature
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Get('article')
  getArticle(@GetUser('id') userId: string, @Query('id') id: string) {
    return this.lab3.getArticle(userId, 'sqli-blind-boolean', id ?? '5');
  }
}
