// src/modules/practice-labs/file-upload/labs/lab2/lab2.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { FileUploadLab2Service } from './lab2.service';

@Controller('practice-labs/file-upload/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: FileUploadLab2Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  @Post('docs/info')
  getInfo(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.getInfo(userId, labId);
  }

  // ❌ الثغرة: يفحص mimeType المرسل من العميل فقط
  @Post('docs/upload')
  uploadDoc(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('filename') filename: string,
    @Body('mimeType') mimeType: string,
    @Body('fileContent') fileContent: string,
  ) {
    return this.lab2Service.uploadDoc(
      userId,
      labId,
      filename,
      mimeType,
      fileContent,
    );
  }

  @Post('docs/execute')
  executeWebshell(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('filename') filename: string,
    @Body('cmd') cmd: string,
  ) {
    return this.lab2Service.executeWebshell(userId, labId, filename, cmd);
  }
}
