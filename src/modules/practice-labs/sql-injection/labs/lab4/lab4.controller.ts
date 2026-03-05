import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab4Service } from './lab4.service';

@Controller('practice-labs/sql-injection/lab4')
@UseGuards(JwtAuthGuard)
export class Lab4Controller {
  constructor(private lab4Service: Lab4Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.initLab(userId, labId);
  }

  @Post('set-name')
  async setDisplayName(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('displayName') displayName: string,
  ) {
    return this.lab4Service.setDisplayName(
      userId,
      labId,
      displayName ?? 'applicant',
    );
  }

  @Post('generate-report')
  async generateReport(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab4Service.generateReport(userId, labId);
  }
}
