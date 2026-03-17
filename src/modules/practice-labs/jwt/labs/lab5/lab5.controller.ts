// src/modules/practice-labs/jwt/labs/lab5/lab5.controller.ts
import { Controller, Post, Get, Body, Headers, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../common/guards';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { Lab5Service } from './lab5.service';

@Controller('practice-labs/jwt/lab5')
@UseGuards(JwtAuthGuard)
export class Lab5Controller {
  constructor(private lab5Service: Lab5Service) {}

  // ── read-only / init ────────────────────────────────────────────────
  @SkipThrottle()
  @Post('start')
  async startLab(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.initLab(userId, labId);
  }

  @SkipThrottle()
  @Get('exploit/jwks')
  async getExploitJWKS(@GetUser('id') userId: string) {
    return this.lab5Service.getExploitJWKS(userId);
  }

  // ── reset ───────────────────────────────────────────────────────────
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset')
  async reset(@GetUser('id') userId: string, @Body('labId') labId: string) {
    return this.lab5Service.initLab(userId, labId);
  }

  // ── vulnerable endpoints ────────────────────────────────────────────
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('auth/login')
  async login(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Body('username') username: string,
  ) {
    return this.lab5Service.login(userId, labId, username);
  }

  // Generate attacker keypair (helper for exploit)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('exploit/generate-keypair')
  async generateKeypair(@GetUser('id') userId: string) {
    return this.lab5Service.generateKeypair(userId);
  }

  // ❌ Fetches keys from jku URL without whitelist validation
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('admin/services')
  async getAdminServices(
    @GetUser('id') userId: string,
    @Body('labId') labId: string,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.lab5Service.getAdminServices(userId, labId, authHeader);
  }
}
