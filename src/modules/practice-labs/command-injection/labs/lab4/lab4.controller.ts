// src/modules/practice-labs/command-injection/labs/lab4/lab4.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab4Service } from './lab4.service';

@Controller('practice-labs/command-injection/lab4')
@UseGuards(JwtAuthGuard)
export class Lab4Controller {
  constructor(private lab4Service: Lab4Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.initLab(userId, labId);
  }

  @Post('servers/list')
  listServers(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.listServers(userId, labId);
  }

  // ❌ الثغرة: hostname في shell script
  @Post('servers/provision')
  provision(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('hostname') hostname: string,
    @Body('region') region: string,
    @Body('size') size: string,
  ) {
    return this.lab4Service.provision(userId, labId, hostname, region, size);
  }
}
