import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab2Service } from './lab2.service';

@Controller('api/v1/practice-labs/api-hacking/lab2')
@UseGuards(JwtAuthGuard)
export class Lab2Controller {
  constructor(private lab2Service: Lab2Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab2Service.initLab(userId, labId);
  }

  @Get('users')
  async getAllUsers(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
  ) {
    return this.lab2Service.getAllUsers(userId, labId);
  }

  @Get('users/:username/profile')
  async getUserProfile(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Param('username') username: string,
  ) {
    return this.lab2Service.getUserProfile(userId, labId, username);
  }

  @Get('users/:username/full')
  async getUserWithRelations(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Param('username') username: string,
  ) {
    return this.lab2Service.getUserWithRelations(userId, labId, username);
  }
}
