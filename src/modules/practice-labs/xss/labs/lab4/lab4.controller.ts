// src/modules/practice-labs/xss/labs/lab4/lab4.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab4Service } from './lab4.service';

@Controller('practice-labs/xss/lab4')
@UseGuards(JwtAuthGuard)
export class Lab4Controller {
  constructor(private lab4Service: Lab4Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.initLab(userId, labId);
  }

  // Step 1: المهاجم يحدّث bio يحتوي على HTML مُخبَّأ في Markdown
  @Post('profile/bio')
  async updateBio(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('bio') bio: string,
  ) {
    return this.lab4Service.updateBio(userId, labId, bio);
  }

  // يعرض الـ profile مع الـ bio الـ raw (يُعرض عبر marked.js في الـ frontend)
  @Post('profile')
  async getProfile(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab4Service.getProfile(userId, labId);
  }

  // Step 2: Admin يفتح Profile Review Panel → XSS ينفّذ في context الـ Admin
  @Post('admin/review-profile')
  async adminReviewProfile(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab4Service.adminReviewProfile(userId, labId);
  }
}
