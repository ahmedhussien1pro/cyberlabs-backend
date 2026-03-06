// src/modules/practice-labs/file-inclusion/labs/lab3/lab3.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/file-inclusion/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  // Step 1: تسميم السجل عبر User-Agent
  @Post('log/poison')
  poisonLog(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('userAgent') userAgent: string,
    @Body('path') path: string,
  ) {
    return this.lab3Service.poisonLog(userId, labId, userAgent, path);
  }

  // عرض السجل الحالي
  @Post('log/view-raw')
  viewRawLog(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.viewRawLog(userId, labId);
  }

  // Step 2: ❌ الثغرة — LFI يضمّن السجل المسموم
  @Post('page/view')
  viewPage(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('page') page: string,
    @Body('cmd') cmd: string,
  ) {
    return this.lab3Service.viewPage(userId, labId, page, cmd);
  }
}
