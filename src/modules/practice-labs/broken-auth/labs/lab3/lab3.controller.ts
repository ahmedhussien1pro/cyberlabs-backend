// src/modules/practice-labs/broken-auth/labs/lab3/lab3.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/broken-auth/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  // يولّد reset link بـ token في الـ URL
  @Post('auth/request-reset')
  requestReset(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('email') email: string,
  ) {
    return this.lab3Service.requestReset(userId, labId, email);
  }

  // محاكاة زيارة صفحة الـ reset — يتسرب الـ token للـ analytics
  @Post('auth/simulate-page-visit')
  simulatePageVisit(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('resetUrl') resetUrl: string,
  ) {
    return this.lab3Service.simulatePageVisit(userId, labId, resetUrl);
  }

  // Analytics server logs (يحتوي على الـ Referer المسرّب)
  @Post('analytics/logs')
  getAnalyticsLogs(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab3Service.getAnalyticsLogs(userId, labId);
  }

  // ❌ يقبل الـ token من URL بدون أي context check
  @Post('auth/do-reset')
  doReset(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.lab3Service.doReset(userId, labId, token, newPassword);
  }
}
