import {
  IsBoolean,
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
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

export class CreateGoalDto {
  @IsString()
  @MaxLength(120)
  title: string;

  @IsOptional() @IsString() @MaxLength(120) ar_title?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;

  @IsOptional() @IsInt() @Min(1) targetValue?: number;

  @IsOptional() @IsEnum(GoalFrequency) frequency?: GoalFrequency;

  @IsOptional() @IsDateString() dueDate?: string;

  // ✅ Added: frontend sends these — whitelist them so forbidNonWhitelisted doesn't reject the request
  @IsOptional() @IsString() @MaxLength(50) category?: string;
  @IsOptional() @IsString() @MaxLength(50) unit?: string;
  @IsOptional() @IsBoolean() isCompleted?: boolean;
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

  // ✅ Added: mirror CreateGoalDto extra fields
  @IsOptional() @IsString() @MaxLength(50) category?: string;
  @IsOptional() @IsString() @MaxLength(50) unit?: string;
  @IsOptional() @IsBoolean() isCompleted?: boolean;
}
