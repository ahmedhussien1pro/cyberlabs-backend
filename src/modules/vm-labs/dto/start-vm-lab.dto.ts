import { IsString, IsOptional, IsUUID } from 'class-validator';

export class StartVmLabDto {
  @IsUUID()
  labTemplateId: string;

  @IsOptional()
  @IsString()
  note?: string;
}
