// src/modules/courses/dto/course-filters.dto.ts
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import {
  CourseAccess,
  Difficulty,
  CourseContentType,
  STATE,
} from '@prisma/client';

export class CourseFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(Difficulty, { message: 'Invalid difficulty' })
  difficulty?: Difficulty;

  @IsOptional()
  @IsEnum(CourseAccess)
  access?: CourseAccess;

  @IsOptional()
  @IsString()
  category?: string; // نفلتر بها على enum CATEGORY أو tags حسب ما تحب

  @IsOptional()
  @IsEnum(CourseContentType)
  contentType?: CourseContentType;

  @IsOptional()
  @IsEnum(STATE)
  status?: STATE;

  @IsOptional()
  onlyFavorites?: boolean;

  @IsOptional()
  onlyEnrolled?: boolean;

  @IsOptional()
  onlyCompleted?: boolean;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 12;
}
