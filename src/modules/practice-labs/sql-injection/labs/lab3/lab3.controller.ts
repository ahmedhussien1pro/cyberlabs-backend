import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/sql-injection/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  @Post('validate-coupon')
  async validateCoupon(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('coupon') coupon: string,
  ) {
    return this.lab3Service.validateCoupon(userId, labId, coupon ?? '');
  }
}
