// src/modules/admin/dto/update-curriculum.dto.ts
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class UpdateCurriculumElementDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  ar_title?: string;

  @IsOptional()
  @IsEnum(['ARTICLE', 'VIDEO', 'QUIZ'])
  type?: string;

  /** Markdown / plain text content for ARTICLE and CODE elements */
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  /** Duration in seconds */
  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateCurriculumTopicDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  ar_title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  ar_description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCurriculumElementDto)
  elements: UpdateCurriculumElementDto[];
}

export class UpdateCurriculumDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCurriculumTopicDto)
  topics: UpdateCurriculumTopicDto[];
}
