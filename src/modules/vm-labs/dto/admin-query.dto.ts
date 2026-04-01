import { IsOptional, IsEnum, IsInt, IsUUID, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { VmInstanceStatus } from '@prisma/client';

export class AdminVmQueryDto {
  @ApiPropertyOptional({ enum: VmInstanceStatus, description: 'Filter by instance status' })
  @IsOptional()
  @IsEnum(VmInstanceStatus)
  status?: VmInstanceStatus;

  @ApiPropertyOptional({ description: 'Filter by template UUID' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Filter by user UUID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
