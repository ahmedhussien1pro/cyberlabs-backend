import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards';
import { CurrentUser } from '../../../common/decorators';
import { LabInstanceService } from '../services/lab-instance.service';

@Controller('labs/:labId/instance')
@UseGuards(JwtAuthGuard)
export class LabInstanceController {
  constructor(private labInstanceService: LabInstanceService) {}

  /**
   * Get user's lab instance (isolated state)
   */
  @Get()
  async getInstance(
    @CurrentUser('id') userId: string,
    @Param('labId') labId: string,
  ) {
    const instance = await this.labInstanceService.getOrCreateInstance(
      userId,
      labId,
    );

    return {
      success: true,
      data: instance,
    };
  }

  /**
   * Get instance state (for IDOR lab: balance, etc.)
   */
  @Get('state')
  async getState(
    @CurrentUser('id') userId: string,
    @Param('labId') labId: string,
  ) {
    const state = await this.labInstanceService.getInstanceState(userId, labId);

    return {
      success: true,
      data: state,
    };
  }

  /**
   * Update instance state (e.g., deduct balance)
   */
  @Put('state')
  async updateState(
    @CurrentUser('id') userId: string,
    @Param('labId') labId: string,
    @Body() body: { state?: any; balance?: number },
  ) {
    const instance = await this.labInstanceService.updateInstanceState(
      userId,
      labId,
      body,
    );

    return {
      success: true,
      data: instance,
    };
  }

  /**
   * Reset instance (start over)
   */
  @Post('reset')
  async resetInstance(
    @CurrentUser('id') userId: string,
    @Param('labId') labId: string,
  ) {
    const instance = await this.labInstanceService.resetInstance(userId, labId);

    return {
      success: true,
      message: 'Lab instance reset successfully',
      data: instance,
    };
  }
}
