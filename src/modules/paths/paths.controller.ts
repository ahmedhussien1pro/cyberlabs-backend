import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PathsService } from './paths.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsString,
  Allow,
} from 'class-validator';

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

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @Allow()
  _t?: any;
}

@Controller('paths')
export class PathsController {
  constructor(private readonly pathsService: PathsService) {}

  // ✅ IMPORTANT: /me MUST be declared before /:slug
  //    otherwise NestJS will match 'me' as a slug param
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMyPaths(@CurrentUser() user: any) {
    return {
      success: true,
      data: await this.pathsService.getMyPaths(user.id),
    };
  }

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

  @Post(':slug/enroll')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async enroll(@Param('slug') slug: string, @CurrentUser() user: any) {
    return this.pathsService.enroll(user.id, slug);
  }
}
