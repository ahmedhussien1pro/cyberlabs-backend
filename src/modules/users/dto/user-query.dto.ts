import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum UserSortBy {
  CREATED_AT = 'createdAt',
  NAME = 'name',
  POINTS = 'totalPoints',
  LABS_COMPLETED = 'completedLabs',
}

export class UserQueryDto {
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
  @IsEnum(UserSortBy)
  sortBy?: UserSortBy = UserSortBy.CREATED_AT;

  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  search?: string;
}
