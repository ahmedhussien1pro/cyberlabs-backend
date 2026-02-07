import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { LabsService } from '../services';
import { LabQueryDto, StartLabDto } from '../dto';
import { JwtAuthGuard } from '../../../common/guards';
import { CurrentUser } from '../../../common/decorators';

@Controller('labs')
@UseGuards(JwtAuthGuard)
export class LabsController {
  constructor(private readonly labsService: LabsService) {}

  /**
   * Get all labs
   * GET /api/labs
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllLabs(@Query() query: LabQueryDto) {
    const result = await this.labsService.getAllLabs(query);
    return {
      success: true,
      ...result,
    };
  }

  /**
   * Start a lab
   * POST /api/labs/start
   */
  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  async startLab(
    @CurrentUser('id') userId: string,
    @Body() startDto: StartLabDto,
  ) {
    const progress = await this.labsService.startLab(userId, startDto);
    return {
      success: true,
      message: 'Lab started successfully',
      data: progress,
    };
  }

  /**
   * Get lab progress
   * GET /api/labs/:id/progress
   */
  @Get(':id/progress')
  @HttpCode(HttpStatus.OK)
  async getLabProgress(
    @CurrentUser('id') userId: string,
    @Param('id') labId: string,
  ) {
    const progress = await this.labsService.getLabProgress(userId, labId);
    return {
      success: true,
      data: progress,
    };
  }

  /**
   * Get my labs progress
   * GET /api/labs/my/progress
   */
  @Get('my/progress')
  @HttpCode(HttpStatus.OK)
  async getMyLabsProgress(@CurrentUser('id') userId: string) {
    const progressList = await this.labsService.getMyLabsProgress(userId);
    return {
      success: true,
      data: progressList,
    };
  }

  /**
   * Get leaderboard
   * GET /api/labs/leaderboard
   */
  @Get('leaderboard/top')
  @HttpCode(HttpStatus.OK)
  async getLeaderboard(@Query('limit') limit?: number) {
    const leaderboard = await this.labsService.getLeaderboard(limit || 10);
    return {
      success: true,
      data: leaderboard,
    };
  }
  /**
   * Get lab by ID
   * GET /api/labs/:id
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getLabById(@Param('id') labId: string) {
    const lab = await this.labsService.getLabById(labId);
    return {
      success: true,
      data: lab,
    };
  }
}
