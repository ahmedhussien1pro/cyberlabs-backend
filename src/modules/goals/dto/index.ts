import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';

export enum GoalFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM',
}

export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  ARCHIVED = 'ARCHIVED',
}

// ✅ Added: frontend sends category + unit — backend must accept them
export enum GoalCategory {
  LABS = 'labs',
  COURSES = 'courses',
  XP = 'xp',
  STREAK = 'streak',
  CUSTOM = 'custom',
}

export class CreateGoalDto {
  @IsString()
  @MaxLength(120)
  title: string;

  @IsOptional() @IsString() @MaxLength(120) ar_title?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;

  @IsOptional() @IsInt() @Min(1) targetValue?: number;

  @IsOptional() @IsEnum(GoalFrequency) frequency?: GoalFrequency;

  @IsOptional() @IsDateString() dueDate?: string;

  // ✅ Added: category sent by frontend (stored as metadata / ignored safely)
  @IsOptional() @IsEnum(GoalCategory) category?: GoalCategory;

  // ✅ Added: unit label sent by frontend (stored as metadata)
  @IsOptional() @IsString() @MaxLength(40) unit?: string;
}

export class UpdateGoalDto {
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsOptional() @IsString() @MaxLength(120) ar_title?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsInt() @Min(0) targetValue?: number;
  @IsOptional() @IsInt() @Min(0) currentValue?: number;
  @IsOptional() @IsEnum(GoalFrequency) frequency?: GoalFrequency;
  @IsOptional() @IsEnum(GoalStatus) status?: GoalStatus;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsEnum(GoalCategory) category?: GoalCategory;
  @IsOptional() @IsString() @MaxLength(40) unit?: string;
  // ✅ Added: allows frontend to complete a goal via PATCH {isCompleted: true}
  @IsOptional() @IsBoolean() isCompleted?: boolean;
}
