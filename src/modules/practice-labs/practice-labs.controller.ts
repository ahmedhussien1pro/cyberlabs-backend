import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PracticeLabsService } from './practice-labs.service';
import { JwtAuthGuard } from '../../common/guards';

@Controller('practice-labs')
@UseGuards(JwtAuthGuard)
export class PracticeLabsController {
  constructor(private readonly practiceLabsService: PracticeLabsService) {}

  /**
   * Get all labs
   * GET /api/practice-labs
   */
  @Get()
  async getAllLabs(@Req() req: any) {
    return this.practiceLabsService.getAllLabs(req.user?.id);
  }

  /**
   * Get statistics
   * GET /api/practice-labs/stats
   */
  @Get('stats')
  async getStats() {
    return this.practiceLabsService.getStats();
  }

  /**
   * Get user progress (all labs or specific lab using query param)
   * GET /api/practice-labs/progress
   * GET /api/practice-labs/progress?labId=xxx
   */
  @Get('progress')
  async getUserProgress(
    @Query('labId') labId: string | undefined,
    @Req() req: any,
  ) {
    return this.practiceLabsService.getUserProgress(req.user.id, labId);
  }

  @Post('launch/consume')
  async consumeToken(@Body('token') token: string, @Req() req: any) {
    return this.practiceLabsService.consumeToken(token, req.user.id);
  }

  /**
   * Get single lab details
   * GET /api/practice-labs/:labId
   */
  @Get(':labId')
  async getLabById(@Param('labId') labId: string, @Req() req: any) {
    return this.practiceLabsService.getLabById(labId, req.user?.id);
  }

  /**
   * Launch Lab
   * POST /api/practice-labs/:labId/launch
   * Returns a short-lived secure token/URL to redirect to the labs subdomain
   */
  @Post(':labId/launch')
  async launchLab(@Param('labId') labId: string, @Req() req: any) {
    return this.practiceLabsService.launchLab(labId, req.user.id);
  }

  /**
   * Submit flag
   * POST /api/practice-labs/:labId/submit
   */
  @Post(':labId/submit')
  async submitFlag(
    @Param('labId') labId: string,
    @Body() body: { flag: string },
    @Req() req: any,
  ) {
    if (!body.flag) {
      throw new HttpException('Flag is required', HttpStatus.BAD_REQUEST);
    }

    return this.practiceLabsService.submitFlag(labId, req.user.id, body.flag);
  }

  /**
   * Get hint
   * POST /api/practice-labs/:labId/hint
   */
  @Post(':labId/hint')
  async getHint(
    @Param('labId') labId: string,
    @Body() body: { hintOrder: number },
    @Req() req: any,
  ) {
    if (!body.hintOrder) {
      throw new HttpException('Hint order is required', HttpStatus.BAD_REQUEST);
    }

    return this.practiceLabsService.getHint(labId, req.user.id, body.hintOrder);
  }
}
