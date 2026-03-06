// src/modules/practice-labs/file-upload/labs/lab3/lab3.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { FileUploadLab3Service } from './lab3.service';

@Controller('practice-labs/file-upload/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: FileUploadLab3Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  @Post('scan/info')
  getInfo(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.getInfo(userId, labId);
  }

  // ❌ الثغرة: يفحص magic bytes فقط
  @Post('scan/upload')
  uploadScan(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('filename') filename: string,
    @Body('magicBytes') magicBytes: string,
    @Body('phpPayload') phpPayload: string,
  ) {
    return this.lab3Service.uploadScan(
      userId,
      labId,
      filename,
      magicBytes,
      phpPayload,
    );
  }

  @Post('scan/execute')
  executeScan(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('filename') filename: string,
    @Body('cmd') cmd: string,
  ) {
    return this.lab3Service.executeWebshell(userId, labId, filename, cmd);
  }
}
