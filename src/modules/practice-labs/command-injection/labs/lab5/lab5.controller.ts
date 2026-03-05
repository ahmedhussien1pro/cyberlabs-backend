// src/modules/practice-labs/command-injection/labs/lab5/lab5.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab5Service } from './lab5.service';

@Controller('practice-labs/command-injection/lab5')
@UseGuards(JwtAuthGuard)
export class Lab5Controller {
  constructor(private lab5Service: Lab5Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.initLab(userId, labId);
  }

  // ❌ الثغرة: blind CMDi في target parameter
  @Post('scan')
  scan(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('target') target: string,
  ) {
    return this.lab5Service.scan(userId, labId, target);
  }

  // سجلات DNS الخاصة بالـ attacker server
  @Post('dns/logs')
  getDnsLogs(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.getDnsLogs(userId, labId);
  }

  // فك تشفير الـ base64 من DNS query
  @Post('dns/decode')
  decodeDns(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('subdomain') subdomain: string,
  ) {
    return this.lab5Service.decodeDns(userId, labId, subdomain);
  }
}
