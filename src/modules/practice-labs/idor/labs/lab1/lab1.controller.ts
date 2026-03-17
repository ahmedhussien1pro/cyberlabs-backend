// src/modules/practice-labs/idor/labs/lab1/lab1.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/idor/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  // ── read-only / init ────────────────────────────────────────────────
  @SkipThrottle()
  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  @SkipThrottle()
  @Post('my-orders')
  getMyOrders(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.getMyOrders(userId, labId);
  }

  // ── reset ───────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  reset(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  // ── vulnerable endpoint ─────────────────────────────────────────────
  // ❌ IDOR: orderId accepted without ownership check
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('orders/track')
  trackOrder(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('orderId') orderId: string,
  ) {
    return this.lab1Service.trackOrder(userId, labId, orderId);
  }
}
