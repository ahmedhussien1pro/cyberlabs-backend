import { Expose, Type } from 'class-transformer';

class SectionInfo {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  ar_title?: string | null; // ← Allow null

  @Expose()
  order: number;

  @Expose()
  lessonsCount: number;

  @Expose()
  completedLessons: number;
}

class CourseDetailedInfo {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  ar_title?: string | null; // ← Allow null

  @Expose()
  description?: string | null; // ← Allow null

  @Expose()
  ar_description?: string | null; // ← Allow null

  @Expose()
  thumbnail?: string | null; // ← Allow null

  @Expose()
  difficulty: string;

  @Expose()
  duration: number;

  @Expose()
  estimatedHours?: number | null; // ← Allow null

  @Expose()
  @Type(() => SectionInfo)
  sections: SectionInfo[];
}

export class EnrollmentDetailsSerializer {
  @Expose()
  id: string;

  @Expose()
  userId: string;

  @Expose()
  courseId: string;

  @Expose()
  @Type(() => CourseDetailedInfo)
  course: CourseDetailedInfo;

  @Expose()
  progress: number;

  @Expose()
  isCompleted: boolean;

  @Expose()
  enrolledAt: Date;

  @Expose()
  completedAt?: Date | null; // ← Allow null

  @Expose()
  lastAccessedAt?: Date | null; // ← Allow null

  @Expose()
  totalLessons: number;

  @Expose()
  completedLessons: number;

  @Expose()
  totalSections: number;

  constructor(partial: Partial<EnrollmentDetailsSerializer>) {
    Object.assign(this, partial);
  }
}
