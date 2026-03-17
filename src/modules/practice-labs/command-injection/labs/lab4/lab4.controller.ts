// src/modules/practice-labs/command-injection/labs/lab4/lab4.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab4Service } from './lab4.service';

@Controller('practice-labs/command-injection/lab4')
@UseGuards(JwtAuthGuard)
export class Lab4Controller {
  constructor(private lab4Service: Lab4Service) {}

  // ── read-only / init ─────────────────────────────────────────────────────
  @SkipThrottle()
  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.initLab(userId, labId);
  }

  @SkipThrottle()
  @Post('servers/list')
  listServers(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.listServers(userId, labId);
  }

  // ── reset ────────────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  reset(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.initLab(userId, labId);
  }

  // ── vulnerable endpoint ───────────────────────────────────────────────────
  // ❌ Hostname CMDi: hostname injected into provisioning shell script
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('servers/provision')
  provision(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('hostname') hostname: string,
    @Body('region') region: string,
    @Body('size') size: string,
  ) {
    return this.lab4Service.provision(userId, labId, hostname, region, size);
  }
}
