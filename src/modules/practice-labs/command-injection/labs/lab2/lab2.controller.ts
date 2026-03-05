// src/modules/practice-labs/command-injection/labs/lab2/lab2.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/command-injection/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  // ❌ الثغرة: blind command injection في format parameter
  @Post('convert')
  convert(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('filename') filename: string,
    @Body('format') format: string,
  ) {
    return this.lab2Service.convert(userId, labId, filename, format);
  }

  // محاكاة قراءة ملف عبر OOB
  @Post('cmdi/read-file')
  readFile(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('path') path: string,
  ) {
    return this.lab2Service.readFile(userId, labId, path);
  }

  // محاكاة OOB exfiltration كاملة
  @Post('cmdi/simulate-oob')
  simulateOob(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('filename') filename: string,
    @Body('format') format: string,
    @Body('injectCmd') injectCmd: string,
  ) {
    return this.lab2Service.simulateOob(
      userId,
      labId,
      filename,
      format,
      injectCmd,
    );
  }
}
