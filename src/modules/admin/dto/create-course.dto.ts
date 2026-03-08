import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  Difficulty,
  CATEGORY,
  CourseAccess,
  CourseContentType,
  CourseColor,
  STATE,
} from '@prisma/client';

export class CreateCourseDto {
  // ─ Required fields ────────────────────────────────────────────────

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase letters, numbers, and hyphens only',
  })
  slug: string;

  @IsNotEmpty()
  @IsString()
  instructorId: string;

  // ─ Localised content ─────────────────────────────────────────

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ar_title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  ar_description?: string;

  @IsOptional()
  @IsString()
  longDescription?: string;

  @IsOptional()
  @IsString()
  ar_longDescription?: string;

  // ─ Taxonomy ──────────────────────────────────────────────────

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional()
  @IsEnum(CATEGORY)
  category?: CATEGORY;

  @IsOptional()
  @IsEnum(CourseAccess)
  access?: CourseAccess;

  @IsOptional()
  @IsEnum(CourseContentType)
  contentType?: CourseContentType;

  @IsOptional()
  @IsEnum(CourseColor)
  color?: CourseColor;

  @IsOptional()
  @IsEnum(STATE)
  state?: STATE;

  // ─ Numeric fields ────────────────────────────────────────────

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  duration?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  estimatedHours?: number;

  // ─ Media ───────────────────────────────────────────────────

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  backgroundImage?: string;

  // ─ Arrays ───────────────────────────────────────────────────

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  topics?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  // ─ Flags ────────────────────────────────────────────────────

  @IsOptional()
  @IsBoolean()
  isNew?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
