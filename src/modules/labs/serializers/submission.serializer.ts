import { Expose } from 'class-transformer';

export class SubmissionSerializer {
  @Expose()
  id: string;

  @Expose()
  userId: string;

  @Expose()
  labId: string;

  @Expose()
  isCorrect: boolean;

  @Expose()
  timeTaken: number;

  @Expose()
  attemptNumber: number;

  @Expose()
  pointsEarned: number;

  @Expose()
  xpEarned: number;

  @Expose()
  submittedAt: Date;

  constructor(partial: Partial<SubmissionSerializer>) {
    Object.assign(this, partial);
  }
}
