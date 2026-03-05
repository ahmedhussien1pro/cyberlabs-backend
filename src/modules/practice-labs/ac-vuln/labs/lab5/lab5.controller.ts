// src/modules/practice-labs/ac-vuln/labs/lab5/lab5.controller.ts
import {
  Controller,
  Post,
  Body,
  Headers,
  UseGuards,
  Delete,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab5Service } from './lab5.service';

@Controller('practice-labs/ac-vuln/lab5')
@UseGuards(JwtAuthGuard)
export class Lab5Controller {
  constructor(private lab5Service: Lab5Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.initLab(userId, labId);
  }

  // ✅ Public: يعرض معلومات المستخدم
  @Post('users/info')
  async getUserInfo(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('username') username: string,
  ) {
    return this.lab5Service.getUserInfo(userId, labId, username);
  }

  // ❌ Admin only (properly protected from direct DELETE)
  @Delete('users/delete')
  async deleteUser(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('username') username: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    // ✅ Proper authorization check on explicit DELETE
    if (userRole !== 'admin') {
      throw new ForbiddenException({
        error: 'Access denied',
        message: 'Admin role required to delete users',
      });
    }
    return this.lab5Service.deleteUser(userId, labId, username);
  }

  // ❌ الثغرة: endpoint يقبل method override بدون re-validation
  @Post('users/action')
  async userAction(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('username') username: string,
    @Headers('x-http-method-override') methodOverride?: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    return this.lab5Service.userAction(
      userId,
      labId,
      username,
      methodOverride,
      userRole,
    );
  }
}
