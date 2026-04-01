import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { VmInstanceStatus } from '@prisma/client';

export class AdminVmQueryDto {
  @IsOptional()
  @IsEnum(VmInstanceStatus)
  status?: VmInstanceStatus;

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
  limit?: number = 20;
}
