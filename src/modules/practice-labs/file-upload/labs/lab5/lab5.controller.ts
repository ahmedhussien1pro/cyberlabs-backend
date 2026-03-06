// src/modules/practice-labs/file-upload/labs/lab5/lab5.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { FileUploadLab5Service } from './lab5.service';

@Controller('practice-labs/file-upload/lab5')
@UseGuards(JwtAuthGuard)
export class Lab5Controller {
  constructor(private lab5Service: FileUploadLab5Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.initLab(userId, labId);
  }

  @Post('backup/info')
  getInfo(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.getInfo(userId, labId);
  }

  // ❌ الثغرة: ZIP extraction بدون path validation
  @Post('backup/upload')
  uploadBackup(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('zipName') zipName: string,
    @Body('zipEntries') zipEntries: Array<{ name: string; content: string }>,
  ) {
    return this.lab5Service.uploadAndExtract(
      userId,
      labId,
      zipName,
      zipEntries,
    );
  }

  // عرض الملفات المستخرجة
  @Post('backup/list-extracted')
  listExtracted(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.listExtracted(userId, labId);
  }

  // تنفيذ الـ backdoor المزروع
  @Post('backup/backdoor-exec')
  backdoorExec(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('cmd') cmd: string,
  ) {
    return this.lab5Service.backdoorExec(userId, labId, cmd);
  }
}
