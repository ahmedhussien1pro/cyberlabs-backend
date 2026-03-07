import {
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsDateString,
  IsArray,
  ValidateNested,
  IsEnum,
  IsNotEmpty,
  IsObject,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum SocialPlatform {
  GITHUB    = 'GITHUB',
  LINKEDIN  = 'LINKEDIN',
  TWITTER   = 'TWITTER',
  YOUTUBE   = 'YOUTUBE',
  FACEBOOK  = 'FACEBOOK',
  PORTFOLIO = 'PORTFOLIO',
  EMAIL     = 'EMAIL',
  OTHER     = 'OTHER',
}

export class SocialLinkDto {
  @IsEnum(SocialPlatform)
  type: SocialPlatform;

  @IsString()
  @IsNotEmpty({ message: 'Social link URL cannot be empty' })
  @MaxLength(500)
  url: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ar_bio?: string;

  // avatarUrl is intentionally excluded.
  // Avatar is updated only via POST /users/me/avatar/confirm

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  /**
   * Send ISO date string (e.g. "1999-05-20") to set,
   * or explicit null to clear the birthday field.
   */
  @IsOptional()
  @Transform(({ value }) => (value === null ? null : value))
  @IsDateString(
    {},
    { message: 'birthday must be a valid ISO date string (YYYY-MM-DD)' },
  )
  birthday?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  socialLinks?: SocialLinkDto[];

  /**
   * Free-form user preferences JSON (theme, language, UI settings, etc.).
   * Stored as Json? in the database — structure is flexible.
   */
  @IsOptional()
  @IsObject()
  preferences?: Record<string, unknown>;
}
