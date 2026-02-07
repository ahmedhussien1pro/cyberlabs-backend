import { IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum ProgressPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  ALL_TIME = 'all_time',
}

export class ProgressQueryDto {
  @IsOptional()
  @IsEnum(ProgressPeriod)
  period?: ProgressPeriod = ProgressPeriod.ALL_TIME;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
