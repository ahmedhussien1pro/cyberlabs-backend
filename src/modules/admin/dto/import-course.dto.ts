// src/modules/admin/dto/import-course.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  Difficulty,
  CATEGORY,
  CourseAccess,
  CourseContentType,
  CourseColor,
} from '@prisma/client';

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return [];
}

function parseBool(value: unknown): boolean {
  return value === 'true' || value === true;
}

export class ImportCourseDto {
  // ─ Required ─────────────────────────────────────────────────────
  @IsNotEmpty()
  @IsString()
  slug: string;

  @IsNotEmpty()
  @IsString()
  instructorId: string;

  @IsNotEmpty()
  @IsEnum(CourseColor)
  color: CourseColor;

  @IsNotEmpty()
  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsNotEmpty()
  @IsEnum(CourseAccess)
  access: CourseAccess;

  @IsNotEmpty()
  @IsEnum(CATEGORY)
  category: CATEGORY;

  @IsNotEmpty()
  @IsEnum(CourseContentType)
  contentType: CourseContentType;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  estimatedHours: number;

  // ─ Optional ──────────────────────────────────────────────────────
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @Transform(({ value }) => parseJsonArray(value))
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @Transform(({ value }) => parseJsonArray(value))
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @Transform(({ value }) => parseJsonArray(value))
  @IsArray()
  @IsString({ each: true })
  ar_skills?: string[];

  @IsOptional()
  @Transform(({ value }) => parseJsonArray(value))
  @IsArray()
  @IsString({ each: true })
  labSlugs?: string[];

  @IsOptional()
  @Transform(({ value }) => parseBool(value))
  @IsBoolean()
  isNew?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseBool(value))
  @IsBoolean()
  isFeatured?: boolean;
  @IsOptional()
  @Transform(({ value }) => parseBool(value))
  @IsBoolean()
  publishImmediately?: boolean;
}
