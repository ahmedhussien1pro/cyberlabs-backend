// src/modules/practice-labs/file-upload/labs/lab4/lab4.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { FileUploadLab4Service } from './lab4.service';

@Controller('practice-labs/file-upload/lab4')
@UseGuards(JwtAuthGuard)
export class Lab4Controller {
  constructor(private lab4Service: FileUploadLab4Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.initLab(userId, labId);
  }

  @Post('profile/info')
  getInfo(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.getInfo(userId, labId);
  }

  // ❌ الثغرة: يقبل SVG بدون sanitization
  @Post('profile/photo/upload')
  uploadPhoto(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('filename') filename: string,
    @Body('attackType') attackType: string,
    @Body('xssPayload') xssPayload: string,
    @Body('ssrfTarget') ssrfTarget: string,
  ) {
    return this.lab4Service.uploadPhoto(
      userId,
      labId,
      filename,
      attackType,
      xssPayload,
      ssrfTarget,
    );
  }

  // محاكاة مشاهدة الـ profile (يُطلق XSS / SSRF)
  @Post('profile/photo/simulate-view')
  simulateView(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('filename') filename: string,
    @Body('viewerRole') viewerRole: string,
  ) {
    return this.lab4Service.simulateView(userId, labId, filename, viewerRole);
  }
}
