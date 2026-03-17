// src/modules/practice-labs/csrf/labs/lab2/lab2.controller.ts
import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/csrf/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  // ── read-only / init ────────────────────────────────────────────────
  @SkipThrottle()
  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  @SkipThrottle()
  @Post('wallet/balance')
  getBalance(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.getBalance(userId, labId);
  }

  // ── reset ───────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  reset(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  // ── vulnerable endpoints ────────────────────────────────────────────
  // ❌ Accepts form-encoded as fallback + no CSRF token
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('transfer')
  transfer(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('toAccount') toAccount: string,
    @Body('amount') amount: number,
    @Headers('content-type') contentType?: string,
    @Headers('origin') origin?: string,
  ) {
    return this.lab2Service.transfer(userId, labId, toAccount, amount, contentType, origin);
  }

  // Simulate victim auto-trigger
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('csrf/simulate-victim')
  simulateVictim(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('toAccount') toAccount: string,
    @Body('amount') amount: number,
  ) {
    return this.lab2Service.simulateVictim(userId, labId, toAccount, amount);
  }
}
