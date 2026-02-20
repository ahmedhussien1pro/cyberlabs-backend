import {
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsUrl,
  IsDateString,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
export enum SocialPlatform {
  GITHUB = 'GITHUB',
  LINKEDIN = 'LINKEDIN',
  TWITTER = 'TWITTER',
  YOUTUBE = 'YOUTUBE',
  FACEBOOK = 'FACEBOOK',
  PORTFOLIO = 'PORTFOLIO',
  EMAIL = 'EMAIL',
  OTHER = 'OTHER',
}

export class SocialLinkDto {
  @IsEnum(SocialPlatform)
  type: SocialPlatform;

  @IsString()
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

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsDateString()
  birthday?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  socialLinks?: SocialLinkDto[];
}
