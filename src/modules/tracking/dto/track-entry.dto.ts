import { IsOptional, IsString, MaxLength } from 'class-validator';

export class TrackEntryDto {
  @IsOptional() @IsString() @MaxLength(100)
  sessionId?: string;

  @IsOptional() @IsString() @MaxLength(100)
  source?: string; // utm_source

  @IsOptional() @IsString() @MaxLength(100)
  medium?: string; // utm_medium

  @IsOptional() @IsString() @MaxLength(200)
  campaign?: string; // utm_campaign

  @IsOptional() @IsString() @MaxLength(100)
  content?: string; // utm_content

  @IsOptional() @IsString() @MaxLength(100)
  term?: string; // utm_term

  @IsOptional() @IsString() @MaxLength(100)
  referralCode?: string; // r= param

  @IsOptional() @IsString() @MaxLength(500)
  landingPage?: string;

  @IsOptional() @IsString() @MaxLength(500)
  page?: string;
}
