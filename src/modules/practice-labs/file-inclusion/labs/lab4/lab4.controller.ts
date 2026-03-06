// src/modules/practice-labs/file-inclusion/labs/lab4/lab4.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab4Service } from './lab4.service';

@Controller('practice-labs/file-inclusion/lab4')
@UseGuards(JwtAuthGuard)
export class Lab4Controller {
  constructor(private lab4Service: Lab4Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.initLab(userId, labId);
  }

  @Post('plugins/list')
  listPlugins(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.listPlugins(userId, labId);
  }

  // محاكاة attacker server — يُقدّم malicious payloads
  @Post('attacker/payloads')
  getAttackerPayloads(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab4Service.getAttackerPayloads(userId, labId);
  }

  // ❌ الثغرة: RFI — يُحمّل ويُنفّذ ملفات PHP خارجية
  @Post('plugins/install')
  installPlugin(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('pluginUrl') pluginUrl: string,
    @Body('cmd') cmd: string,
  ) {
    return this.lab4Service.installPlugin(userId, labId, pluginUrl, cmd);
  }
}
