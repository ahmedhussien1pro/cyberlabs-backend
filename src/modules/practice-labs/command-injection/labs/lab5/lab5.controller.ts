// src/modules/practice-labs/command-injection/labs/lab5/lab5.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab5Service } from './lab5.service';

@Controller('practice-labs/command-injection/lab5')
@UseGuards(JwtAuthGuard)
export class Lab5Controller {
  constructor(private lab5Service: Lab5Service) {}

  // ── read-only / init ─────────────────────────────────────────────────────
  @SkipThrottle()
  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.initLab(userId, labId);
  }

  @SkipThrottle()
  @Post('dns/logs')
  getDnsLogs(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.getDnsLogs(userId, labId);
  }

  @SkipThrottle()
  @Post('dns/decode')
  decodeDns(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('subdomain') subdomain: string,
  ) {
    return this.lab5Service.decodeDns(userId, labId, subdomain);
  }

  // ── reset ────────────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  reset(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.initLab(userId, labId);
  }

  // ── vulnerable endpoint ───────────────────────────────────────────────────
  // ❌ Blind DNS CMDi: target injected into nmap-like command — OOB via DNS
  // Higher limit because DNS exfiltration requires many requests
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('scan')
  scan(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('target') target: string,
  ) {
    return this.lab5Service.scan(userId, labId, target);
  }
}
