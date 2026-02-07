import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class SubmitLabDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsNotEmpty()
  @IsString()
  flagAnswer: string;
}
