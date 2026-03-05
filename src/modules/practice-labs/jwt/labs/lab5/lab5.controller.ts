// src/modules/practice-labs/jwt/labs/lab5/lab5.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab5Service } from './lab5.service';

@Controller('practice-labs/jwt/lab5')
@UseGuards(JwtAuthGuard)
export class Lab5Controller {
  constructor(private lab5Service: Lab5Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.initLab(userId, labId);
  }

  @Post('auth/login')
  async login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('username') username: string,
  ) {
    return this.lab5Service.login(userId, labId, username);
  }

  // Exploit helpers: generate keypair and host malicious JWKS
  @Post('exploit/generate-keypair')
  async generateKeypair(@GetUser('id') userId: string) {
    return this.lab5Service.generateKeypair(userId);
  }

  @Get('exploit/jwks')
  async getExploitJWKS(@GetUser('id') userId: string) {
    return this.lab5Service.getExploitJWKS(userId);
  }

  // ❌ الثغرة: يقبل jku header ويجلب keys من URL خارجي بدون validation
  @Post('admin/services')
  async getAdminServices(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.lab5Service.getAdminServices(userId, labId, authHeader);
  }
}
