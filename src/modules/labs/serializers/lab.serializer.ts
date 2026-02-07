import { Expose } from 'class-transformer';

export class LabSerializer {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  ar_title?: string | null;

  @Expose()
  description?: string | null;

  @Expose()
  ar_description?: string | null;

  @Expose()
  difficulty: string;

  @Expose()
  duration?: number | null;

  @Expose()
  labUrl?: string | null;

  @Expose()
  xpReward: number;

  @Expose()
  pointsReward: number;

  @Expose()
  maxAttempts?: number | null;

  @Expose()
  timeLimit?: number | null;

  @Expose()
  isPublished: boolean;

  @Expose()
  courseId?: string | null;

  constructor(partial: Partial<LabSerializer>) {
    Object.assign(this, partial);
  }
}
