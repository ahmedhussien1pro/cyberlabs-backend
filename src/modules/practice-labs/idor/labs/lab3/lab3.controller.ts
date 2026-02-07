import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/idor/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  @Get('profile/:username')
  async getProfile(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Param('username') username: string,
  ) {
    return this.lab3Service.getProfile(userId, labId, username);
  }

  @Patch('profile/:username')
  async updateProfile(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Param('username') username: string,
    @Body('bio') bio: string,
  ) {
    return this.lab3Service.updateProfile(userId, labId, username, bio);
  }
}
