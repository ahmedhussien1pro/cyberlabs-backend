import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab5Service } from './lab5.service';

@Controller('practice-labs/sql-injection/lab5')
@UseGuards(JwtAuthGuard)
export class Lab5Controller {
  constructor(private lab5Service: Lab5Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.initLab(userId, labId);
  }

  @Post('log-visit')
  async logVisit(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Headers('x-forwarded-for') forwardedFor: string,
  ) {
    return this.lab5Service.logVisit(userId, labId, forwardedFor);
  }
}
