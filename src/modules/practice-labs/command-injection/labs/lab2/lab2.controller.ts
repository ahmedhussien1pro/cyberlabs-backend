// src/modules/practice-labs/command-injection/labs/lab2/lab2.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/command-injection/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  // ── read-only / init ─────────────────────────────────────────────────────
  @SkipThrottle()
  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  // ── reset ────────────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  reset(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  // ── vulnerable endpoints ──────────────────────────────────────────────────
  // ❌ Blind CMDi: format param injected into shell command — no output returned
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('convert')
  convert(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('filename') filename: string,
    @Body('format') format: string,
  ) {
    return this.lab2Service.convert(userId, labId, filename, format);
  }

  // OOB read simulation
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('cmdi/read-file')
  readFile(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('path') path: string,
  ) {
    return this.lab2Service.readFile(userId, labId, path);
  }

  // OOB exfiltration simulation
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('cmdi/simulate-oob')
  simulateOob(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('filename') filename: string,
    @Body('format') format: string,
    @Body('injectCmd') injectCmd: string,
  ) {
    return this.lab2Service.simulateOob(userId, labId, filename, format, injectCmd);
  }
}
