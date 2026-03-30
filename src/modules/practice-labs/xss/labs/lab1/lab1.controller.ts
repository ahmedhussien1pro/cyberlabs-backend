// src/modules/practice-labs/xss/labs/lab1/lab1.controller.ts
import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

const LAB_SLUG = 'xss-asset-search-reflect';

@Controller('practice-labs/xss/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  @SkipThrottle()
  @Post('start')
  async startLab(@GetUser('id') userId: string) {
    return this.lab1Service.initLab(userId, LAB_SLUG);
  }

  @SkipThrottle()
  @Get('progress')
  async getProgress(@GetUser('id') userId: string) {
    return this.lab1Service.initLab(userId, LAB_SLUG);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  async resetLab(@GetUser('id') userId: string) {
    return this.lab1Service.initLab(userId, LAB_SLUG);
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('search')
  async search(
    @GetUser('id') userId: string,
    @Body('query') query: string,
  ) {
    return this.lab1Service.search(userId, LAB_SLUG, query);
  }
}
