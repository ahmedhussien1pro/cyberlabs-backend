import { UserRole } from '../enums/common.enums';

/**
 * Common Type Definitions
 * Shared types across the application
 */

// ==================== Utility Types ====================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type ID = string;
export type Timestamp = Date | string;

// ==================== Multi-Language ====================

export type MultiLanguageText = {
  en: string;
  ar: string;
};

// ==================== File Types ====================

export type FileMetadata = {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  path: string;
  url: string;
  uploadedAt?: Date;
};

// ==================== JWT & Auth ====================

export type JwtPayload = {
  sub: string; // User ID
  email: string;
  role: UserRole;
  type?: 'access' | 'refresh' | 'verification' | 'reset';
  iat?: number;
  exp?: number;
};

export type RequestUser = {
  id: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  isPremium?: boolean;
};

// ==================== OAuth ====================

export type OAuthProfile = {
  provider: string;
  providerId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  accessToken: string;
  refreshToken?: string;
};
