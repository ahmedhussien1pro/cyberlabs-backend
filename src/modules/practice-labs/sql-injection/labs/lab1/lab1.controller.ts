// src/modules/practice-labs/sql-injection/labs/lab1/lab1.controller.ts
import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/sql-injection/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  // POST /practice-labs/sql-injection/lab1/start
  @SkipThrottle()
  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  // POST /practice-labs/sql-injection/lab1/reset
  // Allows user to reset their lab environment to a clean state
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  async resetLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  // GET /practice-labs/sql-injection/lab1/progress?labId=xxx
  @SkipThrottle()
  @Get('progress')
  async getProgress(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
  ) {
    return this.lab1Service.getProgress(userId, labId);
  }

  // POST /practice-labs/sql-injection/lab1/login
  // 🔴 Rate limited — this is the intentionally vulnerable endpoint.
  // Throttle prevents brute-force enumeration even though injection is intentional.
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('login')
  async login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    return this.lab1Service.login(userId, labId, username, password);
  }
}
