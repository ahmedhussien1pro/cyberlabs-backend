// src/modules/practice-labs/bl-vuln/labs/lab1/lab1.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/bl-vuln/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  @Post('products')
  getProducts(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.getProducts(userId, labId);
  }

  // ❌ الثغرة: price يأتي من client
  @Post('checkout')
  checkout(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('productId') productId: string,
    @Body('quantity') quantity: number,
    @Body('price') price: number,
  ) {
    return this.lab1Service.checkout(userId, labId, productId, quantity, price);
  }
}
