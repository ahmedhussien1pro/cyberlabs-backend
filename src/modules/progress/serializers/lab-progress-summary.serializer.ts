import { Expose } from 'class-transformer';

export class LabProgressSummarySerializer {
  @Expose()
  labId: string;

  @Expose()
  labTitle: string;

  @Expose()
  labArTitle?: string | null;

  @Expose()
  difficulty: string;

  @Expose()
  progress: number;

  @Expose()
  attempts: number;

  @Expose()
  hintsUsed: number;

  @Expose()
  isCompleted: boolean;

  @Expose()
  startedAt: Date;

  @Expose()
  completedAt?: Date | null;

  @Expose()
  timeTaken?: number; // in seconds

  @Expose()
  pointsEarned: number;

  @Expose()
  xpEarned: number;

  constructor(partial: Partial<LabProgressSummarySerializer>) {
    Object.assign(this, partial);
  }
}
