import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Redirect,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/ssrf/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  @Get('redirect')
  async redirect(@Query('url') url: string) {
    return this.lab3Service.handleRedirect(url);
  }

  @Post('fetch-profile')
  async fetchProfile(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('profileUrl') profileUrl: string,
  ) {
    return this.lab3Service.fetchUserProfile(userId, labId, profileUrl);
  }

  @Post('state')
  async getState(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.getState(userId, labId);
  }
}
