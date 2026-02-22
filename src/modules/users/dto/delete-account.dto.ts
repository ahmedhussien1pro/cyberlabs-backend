import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DeleteAccountDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
