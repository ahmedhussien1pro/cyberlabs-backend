import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/command-injection/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  /**
   * Initialize lab instance
   */
  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  /**
   * Log request with User-Agent (vulnerable endpoint)
   */
  @Post('log-request')
  async logRequest(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Headers('user-agent') userAgent: string,
    @Body('ipAddress') ipAddress?: string,
  ) {
    return this.lab3Service.logRequest(userId, labId, userAgent, ipAddress);
  }

  /**
   * View recent logs
   */
  @Post('logs')
  async getLogs(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.viewLogs(userId, labId);
  }

  /**
   * Get lab state
   */
  @Post('state')
  async getState(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.getState(userId, labId);
  }
}
