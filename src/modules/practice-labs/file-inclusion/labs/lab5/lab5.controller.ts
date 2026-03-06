// src/modules/practice-labs/file-inclusion/labs/lab5/lab5.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab5Service } from './lab5.service';

@Controller('practice-labs/file-inclusion/lab5')
@UseGuards(JwtAuthGuard)
export class Lab5Controller {
  constructor(private lab5Service: Lab5Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.initLab(userId, labId);
  }

  @Post('docs/list')
  listDocs(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.listDocs(userId, labId);
  }

  // Step 1: رفع PHAR متنكّر كـ PDF
  @Post('docs/upload')
  uploadDoc(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('filename') filename: string,
    @Body('fileType') fileType: string,
    @Body('gadgetClass') gadgetClass: string,
  ) {
    return this.lab5Service.uploadDoc(
      userId,
      labId,
      filename,
      fileType,
      gadgetClass,
    );
  }

  // Step 2: ❌ الثغرة — LFI يقبل phar:// wrapper
  @Post('docs/view')
  viewDoc(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('doc') doc: string,
  ) {
    return this.lab5Service.viewDoc(userId, labId, doc);
  }

  // Step 3: الوصول للـ webshell المزروع
  @Post('docs/shell-access')
  shellAccess(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('cmd') cmd: string,
  ) {
    return this.lab5Service.shellAccess(userId, labId, cmd);
  }
}
