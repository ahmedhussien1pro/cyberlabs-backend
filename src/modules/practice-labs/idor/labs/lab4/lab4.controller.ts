// src/modules/practice-labs/idor/labs/lab4/lab4.controller.ts
import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab4Service } from './lab4.service';

@Controller('practice-labs/idor/lab4')
@UseGuards(JwtAuthGuard)
export class Lab4Controller {
  constructor(private lab4Service: Lab4Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.initLab(userId, labId);
  }

  // ❌ الثغرة 1: IDOR — بدون project membership check
  @Post('issues/:issueId/view')
  viewIssue(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Param('issueId') issueId: string,
  ) {
    return this.lab4Service.viewIssue(userId, labId, issueId);
  }

  // ❌ الثغرة 2: Mass Assignment — Object.assign(issue, body)
  @Post('issues/:issueId/update')
  updateIssue(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Param('issueId') issueId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.lab4Service.updateIssue(userId, labId, issueId, body);
  }

  // محمي: فقط للـ admin
  @Post('project/settings')
  getProjectSettings(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab4Service.getProjectSettings(userId, labId);
  }
}
