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
import { AdminGuard } from '../../common/guards/admin.guard';
import { GetUser } from './shared/decorators/get-user.decorator';

@Controller('practice-labs')
@UseGuards(JwtAuthGuard)
export class PracticeLabsController {
  constructor(private readonly practiceLabsService: PracticeLabsService) {}

  @SkipThrottle()
  @Get()
  getAllLabs(@GetUser('id') userId: string) {
    return this.practiceLabsService.getAllLabs(userId);
  }

  @SkipThrottle()
  @Get('stats')
  getStats() {
    return this.practiceLabsService.getStats();
  }

  @SkipThrottle()
  @Get('progress')
  getUserProgress(
    @GetUser('id') userId: string,
    @Query('labId') labId?: string,
  ) {
    return this.practiceLabsService.getUserProgress(userId, labId);
  }

  @SkipThrottle()
  @Get(':labId')
  getLabById(@Param('labId') labId: string, @GetUser('id') userId: string) {
    return this.practiceLabsService.getLabById(labId, userId);
  }

  // ✅ Admin-only: solution / postSolve / scenarioAdmin
  // Uses existing AdminGuard from src/common/guards/admin.guard.ts
  @SkipThrottle()
  @Get(':labId/admin/solution')
  @UseGuards(AdminGuard)
  getAdminSolution(@Param('labId') labId: string) {
    return this.practiceLabsService.getAdminSolution(labId);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('launch/consume')
  consumeToken(@Body('token') token: string, @GetUser('id') userId: string) {
    if (!token) {
      throw new HttpException('Token is required', HttpStatus.BAD_REQUEST);
    }
    return this.practiceLabsService.consumeToken(token, userId);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post(':labId/launch')
  launchLab(@Param('labId') labId: string, @GetUser('id') userId: string) {
    return this.practiceLabsService.launchLab(labId, userId);
  }

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
