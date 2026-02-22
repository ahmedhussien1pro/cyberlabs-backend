import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards';
import { CurrentUser } from '../../../common/decorators';
import { GoalsService } from '../services/goals.service';
import { CreateGoalDto, UpdateGoalDto } from '../dto';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAll(@CurrentUser('id') userId: string) {
    return { success: true, data: await this.goalsService.getAll(userId) };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getById(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return { success: true, data: await this.goalsService.getById(userId, id) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateGoalDto) {
    return { success: true, data: await this.goalsService.create(userId, dto) };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return {
      success: true,
      data: await this.goalsService.update(userId, id, dto),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.goalsService.delete(userId, id);
  }
}
