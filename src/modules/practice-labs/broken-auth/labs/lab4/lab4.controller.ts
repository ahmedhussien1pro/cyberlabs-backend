// src/modules/practice-labs/broken-auth/labs/lab4/lab4.controller.ts
import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab4Service } from './lab4.service';

@Controller('practice-labs/broken-auth/lab4')
@UseGuards(JwtAuthGuard)
export class Lab4Controller {
  constructor(private lab4Service: Lab4Service) {}

  // ── read-only / init ────────────────────────────────────────────────
  @SkipThrottle()
  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.initLab(userId, labId);
  }

  // ── reset ───────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  reset(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.initLab(userId, labId);
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
    return this.lab4Service.labLogin(userId, labId, email, password);
  }

  // ❌ Logout only client-side; server never invalidates the token
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('auth/logout')
  logout(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('sessionToken') sessionToken: string,
  ) {
    return this.lab4Service.logout(userId, labId, sessionToken);
  }

  // ❌ Accepts token after logout (no server-side blacklist)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('admin/dashboard')
  adminDashboard(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('sessionToken') sessionToken: string,
  ) {
    return this.lab4Service.accessAdminDashboard(userId, labId, sessionToken);
  }
}
