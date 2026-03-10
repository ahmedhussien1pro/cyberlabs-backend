import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum TrackingEventType {
  ENTRY         = 'ENTRY',
  CLICK         = 'CLICK',
  VIEW          = 'VIEW',
  REGISTER      = 'REGISTER',
  ENROLL        = 'ENROLL',
  START_COURSE  = 'START_COURSE',
  COMPLETE_LESSON = 'COMPLETE_LESSON',
  COMPLETE_LAB  = 'COMPLETE_LAB',
}

export class TrackActionDto {
  @IsString() @MaxLength(100)
  sessionId: string;

  @IsEnum(TrackingEventType)
  eventType: TrackingEventType;

  @IsOptional() @IsString() @MaxLength(500)
  page?: string;

  @IsOptional() @IsString() @MaxLength(200)
  element?: string;

  @IsOptional() @IsString() @MaxLength(100)
  referralCode?: string;

  @IsOptional() @IsString() @MaxLength(100)
  source?: string;

  @IsOptional() @IsString() @MaxLength(200)
  campaign?: string;

  @IsOptional()
  meta?: Record<string, any>;
}
