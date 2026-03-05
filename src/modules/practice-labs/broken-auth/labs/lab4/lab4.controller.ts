// src/modules/practice-labs/broken-auth/labs/lab4/lab4.controller.ts
import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab4Service } from './lab4.service';

@Controller('practice-labs/broken-auth/lab4')
@UseGuards(JwtAuthGuard)
export class Lab4Controller {
  constructor(private lab4Service: Lab4Service) {}

  @Post('start')
  start(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab4Service.initLab(userId, labId);
  }

  @Post('auth/login')
  login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.lab4Service.labLogin(userId, labId, email, password);
  }

  // ❌ الثغرة: logout فقط على الـ client بدون server-side invalidation
  @Post('auth/logout')
  logout(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('sessionToken') sessionToken: string,
  ) {
    return this.lab4Service.logout(userId, labId, sessionToken);
  }

  // ❌ الثغرة: يقبل الـ token بعد الـ logout
  @Post('admin/dashboard')
  adminDashboard(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('sessionToken') sessionToken: string,
  ) {
    return this.lab4Service.accessAdminDashboard(userId, labId, sessionToken);
  }
}
