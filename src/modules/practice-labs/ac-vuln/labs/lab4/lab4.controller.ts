// src/modules/practice-labs/ac-vuln/labs/lab4/lab4.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab4Service } from './lab4.service';

@Controller('practice-labs/ac-vuln/lab4')
@UseGuards(JwtAuthGuard)
export class Lab4Controller {
  constructor(private lab4Service: Lab4Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.initLab(userId, labId);
  }

  // ✅ Safe: يعرض فقط documents المستخدم الحالي
  @Post('documents/mine')
  async getMyDocuments(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab4Service.getMyDocuments(userId, labId);
  }

  // ⚠️ Leaky: يرجع 403 لكن يسرّب metadata
  @Post('documents/all')
  async getAllDocuments(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab4Service.getAllDocuments(userId, labId);
  }

  // ❌ الثغرة: يحمّل document بناءً على docId بدون التحقق من ownership
  @Post('documents/download')
  async downloadDocument(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('docId') docId: string,
  ) {
    return this.lab4Service.downloadDocument(userId, labId, docId);
  }
}
