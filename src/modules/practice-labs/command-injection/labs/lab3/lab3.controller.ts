// src/modules/practice-labs/command-injection/labs/lab3/lab3.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/command-injection/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  @Post('logs/list')
  listLogs(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.listLogs(userId, labId);
  }

  // ❌ الثغرة: filename يدخل مباشرة في shell command
  @Post('logs/upload')
  uploadLog(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('filename') filename: string,
    @Body('content') content: string,
  ) {
    return this.lab3Service.uploadLog(userId, labId, filename, content);
  }
}
