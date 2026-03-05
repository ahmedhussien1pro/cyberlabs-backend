// src/modules/practice-labs/idor/labs/lab1/lab1.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/idor/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  @Post('my-orders')
  getMyOrders(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.getMyOrders(userId, labId);
  }

  // ❌ الثغرة: بدون ownership check
  @Post('orders/track')
  trackOrder(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('orderId') orderId: string,
  ) {
    return this.lab1Service.trackOrder(userId, labId, orderId);
  }
}
