import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab1Service } from './lab1.service';

@Controller('practice-labs/sql-injection/lab1')
@UseGuards(JwtAuthGuard)
export class Lab1Controller {
  constructor(private lab1Service: Lab1Service) {}

  // POST /practice-labs/sql-injection/lab1/start
  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab1Service.initLab(userId, labId);
  }

  // GET /practice-labs/sql-injection/lab1/progress?labId=xxx
  // fix: use @Query not @Body — GET requests don't carry a body
  @Get('progress')
  async getProgress(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
  ) {
    return this.lab1Service.getProgress(userId, labId);
  }

  // POST /practice-labs/sql-injection/lab1/login
  // Intentionally vulnerable endpoint — stays JWT-guarded so we can
  // scope the raw SQL to the authenticated user's lab session only
  @Post('login')
  async login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    return this.lab1Service.login(userId, labId, username, password);
  }
}
