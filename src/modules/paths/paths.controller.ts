import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PathsService } from './paths.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class PathFiltersDto {
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

@Controller('paths')
export class PathsController {
  constructor(private readonly pathsService: PathsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async list(
    @Query() filters: PathFiltersDto,
    @CurrentUser() user: any | null,
  ) {
    const userId = user?.id ?? null;
    return this.pathsService.listPaths(userId, filters);
  }

  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  async get(@Param('slug') slug: string, @CurrentUser() user: any | null) {
    const userId = user?.id ?? null;
    return this.pathsService.getBySlug(slug, userId);
  }

  @Get(':slug/enroll')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async enroll(@Param('slug') slug: string, @CurrentUser() user: any) {
    return this.pathsService.enroll(user.id, slug);
  }
}
