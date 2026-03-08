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
import { Difficulty, CATEGORY, LabExecutionMode } from '@prisma/client';

export class CreateLabDto {
  // ─ Required ──────────────────────────────────────────────────────

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

  // ─ Localised content ───────────────────────────────────────────

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
  scenario?: string;

  @IsOptional()
  @IsString()
  ar_scenario?: string;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsString()
  ar_goal?: string;

  // ─ Taxonomy ───────────────────────────────────────────────────

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional()
  @IsEnum(CATEGORY)
  category?: CATEGORY;

  @IsOptional()
  @IsEnum(LabExecutionMode)
  executionMode?: LabExecutionMode;

  // ─ Numeric fields ────────────────────────────────────────────

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  xpReward?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pointsReward?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pointsPerHint?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pointsPerFail?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  duration?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxAttempts?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  timeLimit?: number;

  // ─ Media & Links ────────────────────────────────────────────

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  labUrl?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  isolationMode?: string;

  // ─ Arrays ────────────────────────────────────────────────────

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  // ─ JSON fields (accepted as-is, no deep validation) ───────────────

  @IsOptional()
  engineConfig?: Record<string, unknown>;

  @IsOptional()
  briefing?: Record<string, unknown>;

  @IsOptional()
  stepsOverview?: Record<string, unknown>;

  @IsOptional()
  steps?: Record<string, unknown>;

  @IsOptional()
  postSolve?: Record<string, unknown>;

  @IsOptional()
  initialState?: Record<string, unknown>;

  // ─ SENSITIVE — flag & solution (admin-only write) ──────────────────
  // These fields are only stored in DB and never returned in list endpoints.
  // They are accessible in admin detail view only.

  @IsOptional()
  @IsString()
  flagAnswer?: string;

  @IsOptional()
  solution?: Record<string, unknown>;

  // ─ Flags ────────────────────────────────────────────────────

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
