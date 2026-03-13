import { IsOptional, IsInt, Min, IsString, IsEnum, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class AdminCourseQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsString()
  access?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isPublished?: boolean;

  /** Filter by state: PUBLISHED | DRAFT | COMING_SOON */
  @IsOptional()
  @IsEnum(['PUBLISHED', 'DRAFT', 'COMING_SOON', 'all'])
  state?: 'PUBLISHED' | 'DRAFT' | 'COMING_SOON' | 'all';
}
