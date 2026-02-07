import { Exclude, Expose } from 'class-transformer';

export class UserProfileSerializer {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  bio?: string;

  @Expose()
  ar_bio?: string;

  @Expose()
  avatarUrl?: string;

  @Expose()
  address?: string;

  @Expose()
  birthday?: Date;

  @Expose()
  phoneNumber?: string;

  @Expose()
  role: string;

  @Expose()
  internalRole?: string;

  @Expose()
  isVerified: boolean;

  @Expose()
  isEmailVerified: boolean;

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  lastLoginAt?: Date;

  // Exclude sensitive fields
  @Exclude()
  password: string;

  @Exclude()
  refreshToken?: string;

  @Exclude()
  twoFactorSecret?: string;

  @Exclude()
  failedLoginAttempts: number;

  @Exclude()
  lockedUntil?: Date;

  constructor(partial: Partial<UserProfileSerializer>) {
    Object.assign(this, partial);
  }
}
