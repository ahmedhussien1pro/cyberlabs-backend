// src/modules/practice-labs/xss/labs/lab5/lab5.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab5Service } from './lab5.service';

@Controller('practice-labs/xss/lab5')
@UseGuards(JwtAuthGuard)
export class Lab5Controller {
  constructor(private lab5Service: Lab5Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.initLab(userId, labId);
  }

  // Step 1: إنشاء webhook باسم يحتوي على XSS payload
  // ✅ يُقبَل بدون أي تحذير (هذا ما يجعله "Second-Order")
  @Post('webhook')
  async createWebhook(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('name') name: string,
    @Body('endpoint') endpoint: string,
    @Body('events') events: string[],
  ) {
    return this.lab5Service.createWebhook(
      userId,
      labId,
      name,
      endpoint,
      events,
    );
  }

  // عرض الـ webhooks في الـ UI
  @Post('webhooks')
  async getWebhooks(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab5Service.getWebhooks(userId, labId);
  }

  // Step 2: محاكاة Super Admin يفتح Activity Log
  // ❌ الثغرة تنفّذ هنا — سياق مختلف تمامًا عن السياق الأصلي
  @Post('admin/activity-log')
  async adminViewActivityLog(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab5Service.adminViewActivityLog(userId, labId);
  }
}
