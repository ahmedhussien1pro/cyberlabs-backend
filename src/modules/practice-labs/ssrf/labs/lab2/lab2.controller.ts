import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('practice-labs/ssrf/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  @Post('fetch-url')
  async fetchUrl(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('url') url: string,
  ) {
    return this.lab2Service.fetchUrlWithBlacklist(userId, labId, url);
  }

  @Post('state')
  async getState(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.getState(userId, labId);
  }
}
