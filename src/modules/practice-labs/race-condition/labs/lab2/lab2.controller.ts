import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/race-condition/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  @Post('apply-coupon')
  async applyCoupon(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('couponCode') couponCode: string,
  ) {
    return this.lab2Service.applyCoupon(userId, labId, couponCode);
  }
}
