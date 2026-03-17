// src/modules/practice-labs/broken-auth/labs/lab2/lab2.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/broken-auth/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  // ── read-only / init ─────────────────────────────────────────────────────
  @SkipThrottle()
  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  @SkipThrottle()
  @Post('auth/get-remember-token')
  getRememberToken(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab2Service.getRememberToken(userId, labId);
  }

  // ── reset ────────────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  reset(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  // ── vulnerable endpoints ──────────────────────────────────────────────────
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('auth/login')
  login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.lab2Service.login(userId, labId, email, password);
  }

  // Token analysis helper
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('auth/forge-token')
  forgeToken(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('email') email: string,
    @Body('role') role: string,
  ) {
    return this.lab2Service.forgeToken(userId, labId, email, role);
  }

  // ❌ Broken Auth: remember-me token accepted without DB validation
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('auth/remember-login')
  rememberLogin(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('rememberToken') rememberToken: string,
  ) {
    return this.lab2Service.rememberLogin(userId, labId, rememberToken);
  }
}
