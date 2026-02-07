import { IsNumber, Min, Max, IsOptional, IsBoolean } from 'class-validator';

export class UpdateProgressDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
