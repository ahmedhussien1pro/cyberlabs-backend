// src/modules/practice-labs/jwt/labs/lab4/lab4.controller.ts
import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab4Service } from './lab4.service';

@Controller('practice-labs/jwt/lab4')
@UseGuards(JwtAuthGuard)
export class Lab4Controller {
  constructor(private lab4Service: Lab4Service) {}

  // ── read-only / init ────────────────────────────────────────────────
  @SkipThrottle()
  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.initLab(userId, labId);
  }

  // ── reset ───────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  async reset(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.initLab(userId, labId);
  }

  // ── vulnerable endpoints ────────────────────────────────────────────
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('auth/login')
  async login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('username') username: string,
  ) {
    return this.lab4Service.login(userId, labId, username);
  }

  // ❌ kid header injection → path traversal to /dev/null (empty secret)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('admin/users')
  async getAdminUsers(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.lab4Service.getAdminUsers(userId, labId, authHeader);
  }
}
