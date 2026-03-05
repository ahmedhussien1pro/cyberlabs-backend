// src/modules/practice-labs/idor/labs/lab5/lab5.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab5Service } from './lab5.service';

@Controller('practice-labs/idor/lab5')
@UseGuards(JwtAuthGuard)
export class Lab5Controller {
  constructor(private lab5Service: Lab5Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.initLab(userId, labId);
  }

  @Post('my-reports')
  getMyReports(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.getMyReports(userId, labId);
  }

  // ❌ الثغرة: batch endpoint بدون ownership check
  @Post('reports/batch')
  batchReports(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('reportIds') reportIds: string[],
  ) {
    return this.lab5Service.batchReports(userId, labId, reportIds);
  }
}
