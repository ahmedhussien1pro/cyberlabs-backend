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
import { SubmissionsService } from '../services';
import { SubmitLabDto, SubmissionQueryDto } from '../dto';
import { JwtAuthGuard } from '../../../common/guards';
import { CurrentUser } from '../../../common/decorators';

@Controller('submissions')
@UseGuards(JwtAuthGuard)
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  /**
   * Submit lab solution
   * POST /api/submissions/:labId
   */
  @Post(':labId')
  @HttpCode(HttpStatus.CREATED)
  async submitLab(
    @CurrentUser('id') userId: string,
    @Param('labId') labId: string,
    @Body() submitDto: SubmitLabDto,
  ) {
    const result = await this.submissionsService.submitLab(
      userId,
      labId,
      submitDto,
    );
    return {
      success: true,
      message: result.result.message,
      data: result,
    };
  }

  /**
   * Get lab submissions history
   * GET /api/submissions/:labId/history
   */
  @Get(':labId/history')
  @HttpCode(HttpStatus.OK)
  async getLabSubmissions(
    @CurrentUser('id') userId: string,
    @Param('labId') labId: string,
    @Query() query: SubmissionQueryDto,
  ) {
    const result = await this.submissionsService.getLabSubmissions(
      userId,
      labId,
      query,
    );
    return {
      success: true,
      ...result,
    };
  }

  /**
   * Get all my submissions
   * GET /api/submissions
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getMySubmissions(
    @CurrentUser('id') userId: string,
    @Query() query: SubmissionQueryDto,
  ) {
    const result = await this.submissionsService.getUserSubmissions(
      userId,
      query,
    );
    return {
      success: true,
      ...result,
    };
  }
}
