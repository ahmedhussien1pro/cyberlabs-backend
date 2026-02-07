import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubmissionQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsUUID()
  labId?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isCorrect?: boolean;
}
