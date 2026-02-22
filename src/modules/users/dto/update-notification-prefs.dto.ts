import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPrefsDto {
  @IsOptional() @IsBoolean() emailNotifications?: boolean;
  @IsOptional() @IsBoolean() pushNotifications?: boolean;
  @IsOptional() @IsBoolean() courseUpdates?: boolean;
  @IsOptional() @IsBoolean() labUpdates?: boolean;
  @IsOptional() @IsBoolean() achievementAlerts?: boolean;
  @IsOptional() @IsBoolean() weeklyDigest?: boolean;
  @IsOptional() @IsBoolean() marketingEmails?: boolean;
}
