import { Expose, Type, Transform } from 'class-transformer';

class CourseBasicInfo {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  ar_title?: string | null;

  @Expose()
  thumbnail?: string | null;

  @Expose()
  difficulty: string;

  @Expose()
  duration: number;

  @Expose()
  estimatedHours?: number | null;
}

export class EnrollmentSerializer {
  @Expose()
  id: string;

  @Expose()
  userId: string;

  @Expose()
  courseId: string;

  @Expose()
  @Type(() => CourseBasicInfo)
  course: CourseBasicInfo;

  @Expose()
  progress: number;

  @Expose()
  isCompleted: boolean;

  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value : new Date(value)))
  enrolledAt: Date;

  @Expose()
  @Transform(({ value }) =>
    value ? (value instanceof Date ? value : new Date(value)) : null,
  )
  completedAt?: Date | null;

  @Expose()
  @Transform(({ value }) =>
    value ? (value instanceof Date ? value : new Date(value)) : null,
  )
  lastAccessedAt?: Date | null;
}
