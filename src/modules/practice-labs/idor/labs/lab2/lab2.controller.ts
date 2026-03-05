// src/modules/practice-labs/idor/labs/lab2/lab2.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/idor/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  @Post('my-keys')
  getMyKeys(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.getMyKeys(userId, labId);
  }

  // ❌ الثغرة: بدون ownership check
  @Post('api-keys/view')
  viewKey(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('keyId') keyId: string,
  ) {
    return this.lab2Service.viewKey(userId, labId, keyId);
  }
}
