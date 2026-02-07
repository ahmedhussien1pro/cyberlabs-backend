import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/file-inclusion/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  @Get('view')
  async viewPage(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Query('file') file: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.lab3Service.viewPageWithLogging(userId, labId, file, userAgent);
  }

  @Get('logs')
  async viewLogs(@GetUser('id') userId: string, @Query('labId') labId: string) {
    return this.lab3Service.getAccessLogs(userId, labId);
  }

  @Post('state')
  async getState(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.getState(userId, labId);
  }
}
