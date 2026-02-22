import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum NotificationTab {
  INBOX = 'inbox',
  ARCHIVED = 'archived',
}

export class GetNotificationsDto {
  @IsOptional()
  @IsEnum(NotificationTab)
  tab?: NotificationTab = NotificationTab.INBOX;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
