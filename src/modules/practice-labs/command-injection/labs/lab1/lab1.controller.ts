import { Controller, Post, Body, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/command-injection/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  /**
   * Initialize lab instance
   */
  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  /**
   * Vulnerable ping endpoint
   */
  @Post('ping')
  async pingHost(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('ip') ip: string,
  ) {
    return this.lab1Service.executePing(userId, labId, ip);
  }

  /**
   * Get lab state (for debugging)
   */
  @Post('state')
  async getState(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.getState(userId, labId);
  }
}
