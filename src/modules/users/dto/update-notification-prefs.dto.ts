import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPrefsDto {
  @IsOptional() @IsBoolean() emailNotifications?: boolean;
  @IsOptional() @IsBoolean() pushNotifications?: boolean;
  @IsOptional() @IsBoolean() courseUpdates?: boolean;
  @IsOptional() @IsBoolean() labCompleted?: boolean;
  @IsOptional() @IsBoolean() achievementUnlocked?: boolean;
  @IsOptional() @IsBoolean() weeklyReport?: boolean;
  @IsOptional() @IsBoolean() monthlyDigest?: boolean;
  @IsOptional() @IsBoolean() securityAlerts?: boolean;
  @IsOptional() @IsBoolean() newCoursesAvailable?: boolean;
  @IsOptional() @IsBoolean() promotions?: boolean;
}
