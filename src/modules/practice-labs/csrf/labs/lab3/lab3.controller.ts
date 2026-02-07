import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/csrf/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  @Post('login')
  async login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    return this.lab3Service.login(userId, labId, username, password);
  }

  // ❌ الثغرة: GET request لـ state-changing operation
  @Get('promote')
  async promoteToAdmin(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Query('sessionId') sessionId: string,
    @Query('targetUsername') targetUsername: string,
  ) {
    return this.lab3Service.promoteToAdmin(
      userId,
      labId,
      sessionId,
      targetUsername,
    );
  }

  @Get('delete-user')
  async deleteUser(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Query('sessionId') sessionId: string,
    @Query('targetUsername') targetUsername: string,
  ) {
    return this.lab3Service.deleteUser(
      userId,
      labId,
      sessionId,
      targetUsername,
    );
  }

  @Get('transfer')
  async transfer(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Query('sessionId') sessionId: string,
    @Query('amount') amount: number,
  ) {
    return this.lab3Service.transferViaGet(userId, labId, sessionId, amount);
  }

  @Get('generate-attacks')
  async generateAttacks(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Query('baseUrl') baseUrl: string,
  ) {
    return this.lab3Service.generateAttackUrls(userId, labId, baseUrl);
  }

  @Get('user')
  async getUser(
    @GetUser('id') userId: string,
    @Query('labId') labId: string,
    @Query('username') username: string,
  ) {
    return this.lab3Service.getUser(userId, labId, username);
  }
}
