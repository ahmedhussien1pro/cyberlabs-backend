// src/modules/practice-labs/xss/labs/lab2/lab2.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/xss/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  // Step 1: المهاجم يكتب review يحتوي على XSS payload
  @Post('review')
  async submitReview(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('content') content: string,
    @Body('rating') rating: number,
  ) {
    return this.lab2Service.submitReview(userId, labId, content, rating);
  }

  // للعرض في الـ UI (المستخدم يرى الـ reviews المخزنة)
  @Post('reviews')
  async getReviews(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab2Service.getReviews(userId, labId);
  }

  // Step 2: محاكاة Admin يفتح لوحة المراجعة → الـ XSS ينفّذ
  @Post('admin/moderate')
  async adminModerate(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab2Service.adminModerate(userId, labId);
  }
}
