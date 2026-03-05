// src/modules/practice-labs/bl-vuln/labs/lab5/lab5.controller.ts
import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab5Service } from './lab5.service';

@Controller('practice-labs/bl-vuln/lab5')
@UseGuards(JwtAuthGuard)
export class Lab5Controller {
  constructor(private lab5Service: Lab5Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.initLab(userId, labId);
  }

  // خطوة 1: تقديم طلب زيادة الراتب
  @Post('salary/request')
  submitRequest(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('currentSalary') currentSalary: number,
    @Body('requestedSalary') requestedSalary: number,
    @Body('reason') reason: string,
  ) {
    return this.lab5Service.submitRaiseRequest(
      userId,
      labId,
      currentSalary,
      requestedSalary,
      reason,
    );
  }

  // ❌ الثغرة: لا يتحقق من أن newApproverId ≠ requesterId
  @Post('salary/requests/:requestId/delegate')
  delegateApprover(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Param('requestId') requestId: string,
    @Body('newApproverId') newApproverId: string,
  ) {
    return this.lab5Service.delegateApprover(
      userId,
      labId,
      requestId,
      newApproverId,
    );
  }

  // ❌ الثغرة: لا يتحقق من self-approval
  @Post('salary/requests/:requestId/approve')
  approveRequest(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.lab5Service.approveRequest(userId, labId, requestId);
  }
}
