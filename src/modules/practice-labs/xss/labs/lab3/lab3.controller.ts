// src/modules/practice-labs/xss/labs/lab3/lab3.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/xss/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  // الـ dashboard يستقبل ?msg= ويعيده raw للـ frontend
  // الـ frontend: document.getElementById('notification').innerHTML = msg
  @Post('dashboard')
  async getDashboard(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('msg') msg: string,
  ) {
    return this.lab3Service.getDashboard(userId, labId, msg);
  }

  // المتعلم يرسل الـ URL المصمَّم للتحقق من صحة الـ payload
  @Post('verify')
  async verifyPayload(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('craftedUrl') craftedUrl: string,
  ) {
    return this.lab3Service.verifyPayload(userId, labId, craftedUrl);
  }
}
