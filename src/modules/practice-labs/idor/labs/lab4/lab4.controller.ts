// src/modules/practice-labs/idor/labs/lab4/lab4.controller.ts
import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab4Service } from './lab4.service';

@Controller('practice-labs/idor/lab4')
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
  @Post('project/settings')
  getProjectSettings(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab4Service.getProjectSettings(userId, labId);
  }

  // ── reset ───────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  reset(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.initLab(userId, labId);
  }

  // ── vulnerable endpoints ────────────────────────────────────────────
  // ❌ IDOR: no project membership check
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('issues/:issueId/view')
  viewIssue(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Param('issueId') issueId: string,
  ) {
    return this.lab4Service.viewIssue(userId, labId, issueId);
  }

  // ❌ Mass Assignment: Object.assign(issue, body) with no field whitelist
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('issues/:issueId/update')
  updateIssue(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Param('issueId') issueId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.lab4Service.updateIssue(userId, labId, issueId, body);
  }
}
