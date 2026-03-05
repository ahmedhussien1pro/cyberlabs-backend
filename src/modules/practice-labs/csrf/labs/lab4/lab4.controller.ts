// src/modules/practice-labs/csrf/labs/lab4/lab4.controller.ts
import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab4Service } from './lab4.service';

@Controller('practice-labs/csrf/lab4')
@UseGuards(JwtAuthGuard)
export class Lab4Controller {
  constructor(private lab4Service: Lab4Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.initLab(userId, labId);
  }

  @Post('builds/list')
  listBuilds(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.listBuilds(userId, labId);
  }

  @Post('deployments/history')
  getDeployHistory(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
  ) {
    return this.lab4Service.getDeployHistory(userId, labId);
  }

  // ❌ الثغرة: بدون CSRF token + CORS wildcard subdomain
  @Post('deploy')
  deploy(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('buildId') buildId: string,
    @Body('environment') environment: string,
    @Headers('origin') origin?: string,
  ) {
    return this.lab4Service.deploy(userId, labId, buildId, environment, origin);
  }

  // محاكاة credentialed CORS request من subdomain خبيث
  @Post('csrf/simulate-subdomain-request')
  simulateSubdomain(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('origin') origin: string,
    @Body('buildId') buildId: string,
    @Body('environment') environment: string,
  ) {
    return this.lab4Service.simulateSubdomainRequest(
      userId,
      labId,
      origin,
      buildId,
      environment,
    );
  }
}
