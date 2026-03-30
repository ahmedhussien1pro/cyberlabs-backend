// src/modules/practice-labs/xss/labs/lab2/lab2.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

const LAB_SLUG = 'xss-review-moderation-stored';

@Controller('practice-labs/xss/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  @SkipThrottle()
  @Post('start')
  async startLab(@GetUser('id') userId: string) {
    return this.lab2Service.initLab(userId, LAB_SLUG);
  }

  @SkipThrottle()
  @Post('reviews')
  async getReviews(@GetUser('id') userId: string) {
    return this.lab2Service.getReviews(userId, LAB_SLUG);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  async resetLab(@GetUser('id') userId: string) {
    return this.lab2Service.initLab(userId, LAB_SLUG);
  }

  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('review')
  async submitReview(
    @GetUser('id') userId: string,
    @Body('content') content: string,
    @Body('rating') rating: number,
  ) {
    return this.lab2Service.submitReview(userId, LAB_SLUG, content, rating);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('admin/moderate')
  async adminModerate(@GetUser('id') userId: string) {
    return this.lab2Service.adminModerate(userId, LAB_SLUG);
  }
}
