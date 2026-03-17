// src/modules/practice-labs/practice-labs.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { PracticeLabsService } from './practice-labs.service';
import { JwtAuthGuard } from '../../common/guards';
import { GetUser } from './shared/decorators/get-user.decorator';

@Controller('practice-labs')
@UseGuards(JwtAuthGuard)
export class PracticeLabsController {
  constructor(private readonly practiceLabsService: PracticeLabsService) {}

  // ── Read-only endpoints — no rate limit needed ─────────────────────────────

  // GET /api/practice-labs
  @SkipThrottle()
  @Get()
  getAllLabs(@GetUser('id') userId: string) {
    return this.practiceLabsService.getAllLabs(userId);
  }

  // GET /api/practice-labs/stats
  @SkipThrottle()
  @Get('stats')
  getStats() {
    return this.practiceLabsService.getStats();
  }

  // GET /api/practice-labs/progress?labId=xxx
  @SkipThrottle()
  @Get('progress')
  getUserProgress(
    @GetUser('id') userId: string,
    @Query('labId') labId?: string,
  ) {
    return this.practiceLabsService.getUserProgress(userId, labId);
  }

  // GET /api/practice-labs/:labId
  @SkipThrottle()
  @Get(':labId')
  getLabById(@Param('labId') labId: string, @GetUser('id') userId: string) {
    return this.practiceLabsService.getLabById(labId, userId);
  }

  // ── Mutating endpoints — rate limited ──────────────────────────────────

  // POST /api/practice-labs/launch/consume
  // Light throttle — user loads the lab page
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('launch/consume')
  consumeToken(@Body('token') token: string, @GetUser('id') userId: string) {
    if (!token) {
      throw new HttpException('Token is required', HttpStatus.BAD_REQUEST);
    }
    return this.practiceLabsService.consumeToken(token, userId);
  }

  // POST /api/practice-labs/:labId/launch
  // Moderate throttle — launching too many times is suspicious
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post(':labId/launch')
  launchLab(@Param('labId') labId: string, @GetUser('id') userId: string) {
    return this.practiceLabsService.launchLab(labId, userId);
  }

  // POST /api/practice-labs/:labId/submit
  // 🔴 Strictest throttle — prevents brute-force flag guessing
  // Max 5 attempts per 60s, and 15 total per 10 minutes
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post(':labId/submit')
  submitFlag(
    @Param('labId') labId: string,
    @Body() body: { flag: string; attemptId?: string },
    @GetUser('id') userId: string,
  ) {
    if (!body?.flag) {
      throw new HttpException('Flag is required', HttpStatus.BAD_REQUEST);
    }
    return this.practiceLabsService.submitFlag(
      labId,
      userId,
      body.flag,
      body.attemptId,
    );
  }

  // POST /api/practice-labs/:labId/hint
  // Moderate throttle — prevents hint farming / spam
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  @Post(':labId/hint')
  getHint(
    @Param('labId') labId: string,
    @Body() body: { hintOrder: number },
    @GetUser('id') userId: string,
  ) {
    if (!body?.hintOrder) {
      throw new HttpException('Hint order is required', HttpStatus.BAD_REQUEST);
    }
    return this.practiceLabsService.getHint(labId, userId, body.hintOrder);
  }
}
