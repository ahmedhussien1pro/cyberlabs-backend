// src/modules/practice-labs/ac-vuln/labs/lab2/lab2.controller.ts
import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/ac-vuln/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  // ❌ الثغرة: يقرأ X-User-Role من الـ headers ويثق فيه بدون التحقق
  @Post('admin/users')
  async getAdminUsers(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    return this.lab2Service.getAdminUsers(userId, labId, userRole);
  }

  // للمستخدم العادي: يعرض الطلبات الخاصة به
  @Post('orders')
  async getMyOrders(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab2Service.getMyOrders(userId, labId);
  }
}
