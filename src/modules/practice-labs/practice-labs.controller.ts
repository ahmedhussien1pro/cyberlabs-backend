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
import { PracticeLabsService } from './practice-labs.service';
import { JwtAuthGuard } from '../../common/guards';
import { GetUser } from './shared/decorators/get-user.decorator';

@Controller('practice-labs')
@UseGuards(JwtAuthGuard)
export class PracticeLabsController {
  constructor(private readonly practiceLabsService: PracticeLabsService) {}

  // GET /api/practice-labs
  @Get()
  async getAllLabs(@GetUser('id') userId: string) {
    return this.practiceLabsService.getAllLabs(userId);
  }

  // GET /api/practice-labs/stats
  @Get('stats')
  async getStats() {
    return this.practiceLabsService.getStats();
  }

  // GET /api/practice-labs/progress?labId=xxx
  @Get('progress')
  async getUserProgress(
    @Query('labId') labId: string | undefined,
    @GetUser('id') userId: string,
  ) {
    return this.practiceLabsService.getUserProgress(userId, labId);
  }

  // POST /api/practice-labs/launch/consume
  @Post('launch/consume')
  async consumeToken(
    @Body('token') token: string,
    @GetUser('id') userId: string,
  ) {
    if (!token) {
      throw new HttpException('Token is required', HttpStatus.BAD_REQUEST);
    }
    return this.practiceLabsService.consumeToken(token, userId);
  }

  // GET /api/practice-labs/:labId
  @Get(':labId')
  async getLabById(
    @Param('labId') labId: string,
    @GetUser('id') userId: string,
  ) {
    return this.practiceLabsService.getLabById(labId, userId);
  }

  // POST /api/practice-labs/:labId/launch
  @Post(':labId/launch')
  async launchLab(
    @Param('labId') labId: string,
    @GetUser('id') userId: string,
  ) {
    return this.practiceLabsService.launchLab(labId, userId);
  }

  // POST /api/practice-labs/:labId/submit
  @Post(':labId/submit')
  async submitFlag(
    @Param('labId') labId: string,
    @Body() body: { flag: string },
    @GetUser('id') userId: string,
  ) {
    if (!body.flag) {
      throw new HttpException('Flag is required', HttpStatus.BAD_REQUEST);
    }
    return this.practiceLabsService.submitFlag(labId, userId, body.flag);
  }

  // POST /api/practice-labs/:labId/hint
  @Post(':labId/hint')
  async getHint(
    @Param('labId') labId: string,
    @Body() body: { hintOrder: number },
    @GetUser('id') userId: string,
  ) {
    if (!body.hintOrder) {
      throw new HttpException('Hint order is required', HttpStatus.BAD_REQUEST);
    }
    return this.practiceLabsService.getHint(labId, userId, body.hintOrder);
  }
}
