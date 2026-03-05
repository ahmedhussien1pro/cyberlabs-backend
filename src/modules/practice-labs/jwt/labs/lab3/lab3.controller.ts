// src/modules/practice-labs/jwt/labs/lab3/lab3.controller.ts
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
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/jwt/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  // يصدر RS256 JWT token
  @Post('auth/login')
  async login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('username') username: string,
  ) {
    return this.lab3Service.login(userId, labId, username);
  }

  // يعرض الـ public key (JWKS format)
  @Get('.well-known/jwks.json')
  async getJWKS() {
    return this.lab3Service.getJWKS();
  }

  // يعرض الـ public key بصيغة PEM
  @Get('public-key.pem')
  async getPublicKeyPEM() {
    return this.lab3Service.getPublicKeyPEM();
  }

  // ❌ الثغرة: يقبل HS256 ويستخدم public key كـ HMAC secret
  @Post('admin/transactions')
  async getAdminTransactions(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.lab3Service.getAdminTransactions(userId, labId, authHeader);
  }
}
