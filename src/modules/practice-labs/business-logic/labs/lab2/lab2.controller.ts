// src/modules/practice-labs/bl-vuln/labs/lab2/lab2.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/bl-vuln/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  @Post('order/create')
  createOrder(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('planId') planId: string,
  ) {
    return this.lab2Service.createOrder(userId, labId, planId);
  }

  // ❌ الثغرة 1: coupon reuse (race condition window)
  // ❌ الثغرة 2: stacking
  @Post('order/apply-coupon')
  applyCoupon(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('orderId') orderId: string,
    @Body('coupon') coupon: string,
  ) {
    return this.lab2Service.applyCoupon(userId, labId, orderId, coupon);
  }

  @Post('order/checkout')
  checkout(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('orderId') orderId: string,
  ) {
    return this.lab2Service.checkout(userId, labId, orderId);
  }
}
