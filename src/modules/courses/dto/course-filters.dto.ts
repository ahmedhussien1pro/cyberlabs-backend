import { IsEnum, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
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
  category?: string;

  @IsOptional()
  @IsEnum(CourseContentType)
  contentType?: CourseContentType;

  @IsOptional()
  @IsEnum(STATE)
  status?: STATE;

  @IsOptional()
  @Type(() => Boolean)
  onlyFavorites?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  onlyEnrolled?: boolean;

  @IsOptional()
  @Type(() => Boolean)
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
  @Max(50, { message: 'Limit cannot exceed 50 items per page' })
  limit?: number = 12;
}
