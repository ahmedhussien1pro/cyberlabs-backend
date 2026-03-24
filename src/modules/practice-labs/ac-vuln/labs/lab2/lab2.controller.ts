// src/modules/practice-labs/ac-vuln/labs/lab2/lab2.controller.ts
import { Controller, Post, Get, Body, Headers, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/ac-vuln/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  @Post('orders')
  getMyOrders(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.getMyOrders(userId, labId);
  }

  // ❌ VULN: reads role from X-User-Role header instead of JWT
  @Post('admin/users')
  getAdminUsers(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    return this.lab2Service.getAdminUsers(userId, labId, userRole);
  }

  @Get('progress')
  progress(@GetUser('id') userId: string, @Query('labId') labId: string) {
    return this.lab2Service.getProgress(userId, labId);
  }

  @Post('submit')
  submit(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.submitFlag(userId, labId);
  }
}
