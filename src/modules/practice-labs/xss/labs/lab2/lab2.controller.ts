import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/xss/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  @Post('comment')
  async addComment(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('postId') postId: string,
    @Body('comment') comment: string,
  ) {
    return this.lab2Service.addComment(userId, labId, postId, comment);
  }

  @Get('comments')
  async getComments(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
  ) {
    return this.lab2Service.getComments(userId, labId);
  }
}
