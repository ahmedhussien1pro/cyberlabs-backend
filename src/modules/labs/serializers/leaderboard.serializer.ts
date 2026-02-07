import { Expose } from 'class-transformer';

export class LeaderboardEntrySerializer {
  @Expose()
  rank: number;

  @Expose()
  userId: string;

  @Expose()
  userName: string;

  @Expose()
  avatarUrl?: string | null;

  @Expose()
  totalPoints: number;

  @Expose()
  totalXP: number;

  @Expose()
  completedLabs: number;

  @Expose()
  level: number;

  constructor(partial: Partial<LeaderboardEntrySerializer>) {
    Object.assign(this, partial);
  }
}
