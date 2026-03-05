// src/modules/practice-labs/bl-vuln/labs/lab3/lab3.controller.ts
import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/bl-vuln/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  // خطوة 1: تقديم الطلب
  @Post('apply')
  apply(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('jobTitle') jobTitle: string,
    @Body('resume') resume: string,
  ) {
    return this.lab3Service.applyForJob(userId, labId, jobTitle, resume);
  }

  // ❌ الثغرة: يقبل أي step بدون التحقق من تسلسل الخطوات
  @Post('application/:applicationId/step/:step')
  advanceStep(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Param('applicationId') applicationId: string,
    @Param('step') step: string,
    @Body('data') data?: any,
  ) {
    return this.lab3Service.advanceStep(
      userId,
      labId,
      applicationId,
      step,
      data,
    );
  }
}
