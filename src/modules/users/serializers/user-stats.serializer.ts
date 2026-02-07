import { Expose } from 'class-transformer';

export class UserStatsSerializer {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  avatarUrl?: string;

  @Expose()
  role: string;

  // Points & XP
  @Expose()
  totalPoints: number;

  @Expose()
  totalXP: number;

  @Expose()
  level: number;

  // Learning stats
  @Expose()
  enrolledCourses: number;

  @Expose()
  completedCourses: number;

  @Expose()
  completedLabs: number;

  @Expose()
  badgesCount: number;

  @Expose()
  certificationsCount: number;

  // Activity stats
  @Expose()
  totalHours: number;

  @Expose()
  activeDays: number;

  @Expose()
  currentStreak: number;

  @Expose()
  longestStreak: number;

  @Expose()
  lastActivityDate?: Date;

  constructor(partial: Partial<UserStatsSerializer>) {
    Object.assign(this, partial);
  }
}
