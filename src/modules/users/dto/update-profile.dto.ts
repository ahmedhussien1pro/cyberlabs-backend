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

  /**
   * Strip empty strings so @IsOptional() correctly skips validation.
   * class-validator @IsOptional only ignores null/undefined — not ''.
   */
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MaxLength(500)
  ar_bio?: string;

  // avatarUrl is intentionally excluded.
  // Avatar is updated only via POST /users/me/avatar/confirm

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MaxLength(255)
  address?: string;

  /**
   * Send ISO date string (e.g. "1999-05-20") to set,
   * explicit null to clear, or omit/send '' to leave unchanged.
   *
   * Fix: '' → undefined so @IsOptional correctly skips @IsDateString.
   * Sending '' from an empty <input type="date"> previously caused 400.
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null) return null;           // explicit clear
    if (!value || value === '') return undefined; // empty input → skip
    return value;                              // valid date string
  })
  @IsDateString(
    {},
    { message: 'birthday must be a valid ISO date string (YYYY-MM-DD)' },
  )
  birthday?: string | null;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
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
   */
  @IsOptional()
  @IsObject()
  preferences?: Record<string, unknown>;
}
