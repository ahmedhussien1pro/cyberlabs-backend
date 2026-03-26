// src/modules/users/dto/education.dto.ts
import {
  IsString, IsOptional, IsBoolean, IsInt, Min, Max,
  MaxLength, ValidateNested, IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EducationItemDto {
  /** Present when updating an existing record; absent when creating */
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MaxLength(200)
  institution: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  ar_institution?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  degree?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  field?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  startYear?: number;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  endYear?: number;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;
}

export class UpsertEducationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationItemDto)
  education: EducationItemDto[];
}
