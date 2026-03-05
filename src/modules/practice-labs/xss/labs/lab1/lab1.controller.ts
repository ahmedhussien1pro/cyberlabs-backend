// src/modules/practice-labs/xss/labs/lab1/lab1.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/xss/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  // ❌ نقطة الثغرة: query يُعكس مباشرة في الـ response بدون encoding
  @Post('search')
  async search(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('query') query: string,
  ) {
    return this.lab1Service.search(userId, labId, query);
  }
}
