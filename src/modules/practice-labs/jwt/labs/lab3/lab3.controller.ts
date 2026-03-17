// src/modules/practice-labs/jwt/labs/lab3/lab3.controller.ts
import { Controller, Post, Get, Body, Headers, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab3Service } from './lab3.service';

@Controller('practice-labs/jwt/lab3')
@UseGuards(JwtAuthGuard)
export class Lab3Controller {
  constructor(private lab3Service: Lab3Service) {}

  // ── read-only / init ────────────────────────────────────────────────
  @SkipThrottle()
  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  @SkipThrottle()
  @Get('.well-known/jwks.json')
  async getJWKS() {
    return this.lab3Service.getJWKS();
  }

  @SkipThrottle()
  @Get('public-key.pem')
  async getPublicKeyPEM() {
    return this.lab3Service.getPublicKeyPEM();
  }

  // ── reset ───────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  async reset(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab3Service.initLab(userId, labId);
  }

  // ── vulnerable endpoints ────────────────────────────────────────────
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('auth/login')
  async login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('username') username: string,
  ) {
    return this.lab3Service.login(userId, labId, username);
  }

  // ❌ Accepts HS256 token using public key as HMAC secret (alg confusion)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('admin/transactions')
  async getAdminTransactions(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.lab3Service.getAdminTransactions(userId, labId, authHeader);
  }
}
