// src/modules/practice-labs/csrf/labs/lab4/lab4.controller.ts
import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab4Service } from './lab4.service';

@Controller('practice-labs/csrf/lab4')
@UseGuards(JwtAuthGuard)
export class Lab4Controller {
  constructor(private lab4Service: Lab4Service) {}

  // ── read-only / init ────────────────────────────────────────────────
  @SkipThrottle()
  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.initLab(userId, labId);
  }

  @SkipThrottle()
  @Post('builds/list')
  listBuilds(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.listBuilds(userId, labId);
  }

  @SkipThrottle()
  @Post('deployments/history')
  getDeployHistory(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab4Service.getDeployHistory(userId, labId);
  }

  // ── reset ───────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  reset(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.initLab(userId, labId);
  }

  // ── vulnerable endpoints ────────────────────────────────────────────
  // ❌ No CSRF token + CORS wildcard subdomain accepted
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('deploy')
  deploy(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('buildId') buildId: string,
    @Body('environment') environment: string,
    @Headers('origin') origin?: string,
  ) {
    return this.lab4Service.deploy(userId, labId, buildId, environment, origin);
  }

  // Simulate credentialed CORS request from malicious subdomain
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('csrf/simulate-subdomain-request')
  simulateSubdomain(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('origin') origin: string,
    @Body('buildId') buildId: string,
    @Body('environment') environment: string,
  ) {
    return this.lab4Service.simulateSubdomainRequest(userId, labId, origin, buildId, environment);
  }
}
