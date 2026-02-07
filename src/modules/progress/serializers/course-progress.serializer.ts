import { Expose } from 'class-transformer';

export class CourseProgressSerializer {
  @Expose()
  courseId: string;

  @Expose()
  courseTitle: string;

  @Expose()
  courseArTitle?: string | null;

  @Expose()
  courseThumbnail?: string | null;

  @Expose()
  difficulty: string;

  @Expose()
  progress: number;

  @Expose()
  isCompleted: boolean;

  @Expose()
  totalLessons: number;

  @Expose()
  completedLessons: number;

  @Expose()
  totalSections: number;

  @Expose()
  enrolledAt: Date;

  @Expose()
  lastAccessedAt?: Date | null;

  @Expose()
  completedAt?: Date | null;

  @Expose()
  estimatedTimeRemaining?: number; // in hours

  constructor(partial: Partial<CourseProgressSerializer>) {
    Object.assign(this, partial);
  }
}
