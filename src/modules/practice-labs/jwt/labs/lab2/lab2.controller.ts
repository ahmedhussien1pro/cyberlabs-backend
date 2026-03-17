// src/modules/practice-labs/jwt/labs/lab2/lab2.controller.ts
import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/jwt/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  // ── read-only / init ────────────────────────────────────────────────
  @SkipThrottle()
  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  @SkipThrottle()
  @Post('courses/free')
  async getFreeCourses(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab2Service.getFreeCourses(userId, labId);
  }

  // ── reset ───────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  async reset(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  // ── vulnerable endpoints ────────────────────────────────────────────
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('auth/login')
  async login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('username') username: string,
  ) {
    return this.lab2Service.login(userId, labId, username);
  }

  // JWT crack simulation — weak secret brute-force
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('jwt/crack')
  async crackJWT(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('token') token: string,
  ) {
    return this.lab2Service.crackJWT(userId, labId, token);
  }

  // ❌ Accepts forged admin token signed with cracked weak secret
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('courses/premium')
  async getPremiumCourses(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.lab2Service.getPremiumCourses(userId, labId, authHeader);
  }
}
