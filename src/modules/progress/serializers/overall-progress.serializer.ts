import { Expose, Type } from 'class-transformer';

class LearningStats {
  @Expose()
  totalCoursesEnrolled: number;

  @Expose()
  coursesInProgress: number;

  @Expose()
  coursesCompleted: number;

  @Expose()
  totalLabsStarted: number;

  @Expose()
  labsInProgress: number;

  @Expose()
  labsCompleted: number;

  @Expose()
  totalLessonsCompleted: number;

  @Expose()
  averageCourseProgress: number;

  @Expose()
  averageLabProgress: number;
}

class GamificationStats {
  @Expose()
  totalPoints: number;

  @Expose()
  totalXP: number;

  @Expose()
  level: number;

  @Expose()
  badgesEarned: number;

  @Expose()
  achievementsUnlocked: number;

  @Expose()
  rank?: number;
}

class TimeStats {
  @Expose()
  totalHoursSpent: number;

  @Expose()
  activeDays: number;

  @Expose()
  currentStreak: number;

  @Expose()
  longestStreak: number;

  @Expose()
  averageDailyTime: number; // in minutes

  @Expose()
  lastActivityDate?: Date | null;
}

class RecentActivity {
  @Expose()
  type: string; // 'course' | 'lab' | 'lesson'

  @Expose()
  title: string;

  @Expose()
  action: string; // 'started' | 'completed' | 'in_progress'

  @Expose()
  timestamp: Date;
}

export class OverallProgressSerializer {
  @Expose()
  userId: string;

  @Expose()
  userName: string;

  @Expose()
  @Type(() => LearningStats)
  learning: LearningStats;

  @Expose()
  @Type(() => GamificationStats)
  gamification: GamificationStats;

  @Expose()
  @Type(() => TimeStats)
  time: TimeStats;

  @Expose()
  @Type(() => RecentActivity)
  recentActivities: RecentActivity[];

  constructor(partial: Partial<OverallProgressSerializer>) {
    Object.assign(this, partial);
  }
}
