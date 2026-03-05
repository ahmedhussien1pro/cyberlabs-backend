// src/modules/practice-labs/csrf/labs/lab1/lab1.controller.ts
import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/csrf/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  @Post('account/info')
  getAccountInfo(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.getAccountInfo(userId, labId);
  }

  // ❌ الثغرة: بدون CSRF token أو Origin check
  @Post('account/change-email')
  changeEmail(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('newEmail') newEmail: string,
    @Headers('origin') origin?: string,
    @Headers('referer') referer?: string,
  ) {
    return this.lab1Service.changeEmail(
      userId,
      labId,
      newEmail,
      origin,
      referer,
    );
  }

  // محاكاة الضحية تزور الصفحة الخبيثة
  @Post('csrf/simulate-victim')
  simulateVictim(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('attackerEmail') attackerEmail: string,
  ) {
    return this.lab1Service.simulateVictim(userId, labId, attackerEmail);
  }
}
