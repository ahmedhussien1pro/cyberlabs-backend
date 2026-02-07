import { Expose, Type } from 'class-transformer';

class LabInfo {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  ar_title?: string | null;

  @Expose()
  difficulty: string;

  @Expose()
  pointsReward: number;

  @Expose()
  xpReward: number;
}

export class LabProgressSerializer {
  @Expose()
  id: string;

  @Expose()
  userId: string;

  @Expose()
  labId: string;

  @Expose()
  @Type(() => LabInfo)
  lab: LabInfo;

  @Expose()
  progress: number;

  @Expose()
  attempts: number;

  @Expose()
  hintsUsed: number;

  @Expose()
  flagSubmitted: boolean;

  @Expose()
  startedAt: Date;

  @Expose()
  completedAt?: Date | null;

  @Expose()
  lastAccess?: Date | null;

  constructor(partial: Partial<LabProgressSerializer>) {
    Object.assign(this, partial);
  }
}
