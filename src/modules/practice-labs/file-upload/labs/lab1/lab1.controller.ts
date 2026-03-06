// src/modules/practice-labs/file-upload/labs/lab1/lab1.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { FileUploadLab1Service } from './lab1.service';

@Controller('practice-labs/file-upload/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: FileUploadLab1Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  @Post('profile/info')
  getInfo(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.getInfo(userId, labId);
  }

  // ❌ الثغرة: blacklist-only extension check
  @Post('profile/avatar/upload')
  uploadAvatar(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('filename') filename: string,
    @Body('phpCode') phpCode: string,
    @Body('mimeType') mimeType: string,
  ) {
    return this.lab1Service.uploadAvatar(
      userId,
      labId,
      filename,
      phpCode,
      mimeType,
    );
  }

  // تنفيذ الـ webshell المرفوع
  @Post('profile/avatar/execute')
  executeWebshell(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('filename') filename: string,
    @Body('cmd') cmd: string,
  ) {
    return this.lab1Service.executeWebshell(userId, labId, filename, cmd);
  }
}
