/**
 * Common Enums
 * Shared enumerations across the application
 */

// ==================== User & Authentication ====================

/**
 * User Roles
 */
export enum UserRole {
  STUDENT = 'STUDENT',
  INSTRUCTOR = 'INSTRUCTOR',
  ADMIN = 'ADMIN',
}

/**
 * Account Status
 */
export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
}

/**
 * OAuth Provider
 */
export enum OAuthProvider {
  GOOGLE = 'GOOGLE',
  GITHUB = 'GITHUB',
}

// ==================== Localization ====================

/**
 * Supported Languages
 */
export enum Language {
  EN = 'en',
  AR = 'ar',
}

// ==================== File Storage ====================

/**
 * File Storage Types
 */
export enum FileStorageType {
  S3 = 's3',
  LOCAL = 'local',
}

/**
 * File Types
 */
export enum FileType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  ARCHIVE = 'ARCHIVE',
}

// ==================== Sorting & Filtering ====================

/**
 * Sort Order
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

// ==================== Courses & Labs ====================

/**
 * Lab Difficulty Levels
 */
export enum LabDifficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

/**
 * Course Status
 */
export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  COMING_SOON = 'COMING_SOON',
}

/**
 * Course Categories
 */
export enum CourseCategory {
  ALL = 'ALL',
  FUNDAMENTALS = 'FUNDAMENTALS',
  VULNERABILITIES = 'VULNERABILITIES',
  TOOLS_TECHNIQUES = 'TOOLS_TECHNIQUES',
  WEB_SECURITY = 'WEB_SECURITY',
  NETWORK_SECURITY = 'NETWORK_SECURITY',
  CRYPTOGRAPHY = 'CRYPTOGRAPHY',
  MALWARE_ANALYSIS = 'MALWARE_ANALYSIS',
  INCIDENT_RESPONSE = 'INCIDENT_RESPONSE',
}

/**
 * Course Level
 */
export enum CourseLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

/**
 * Lesson Types
 */
export enum LessonType {
  VIDEO = 'VIDEO',
  ARTICLE = 'ARTICLE',
  QUIZ = 'QUIZ',
  LAB = 'LAB',
  ASSIGNMENT = 'ASSIGNMENT',
}

/**
 * Enrollment Status
 */
export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED',
  EXPIRED = 'EXPIRED',
}

/**
 * Progress Status
 */
export enum ProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

// ==================== Subscription & Payments ====================

/**
 * Subscription Tiers
 */
export enum SubscriptionTier {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
}

/**
 * Subscription Status
 */
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PAST_DUE = 'PAST_DUE',
  TRIALING = 'TRIALING',
}

/**
 * Payment Status
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

// ==================== Notifications ====================

/**
 * Notification Types
 */
export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  ACHIEVEMENT = 'ACHIEVEMENT',
  BADGE = 'BADGE',
  COURSE_UPDATE = 'COURSE_UPDATE',
  NEW_MESSAGE = 'NEW_MESSAGE',
  SYSTEM = 'SYSTEM',
}

/**
 * Notification Status
 */
export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

// ==================== Gamification ====================

/**
 * Achievement Types
 */
export enum AchievementType {
  COURSE_COMPLETION = 'COURSE_COMPLETION',
  LAB_COMPLETION = 'LAB_COMPLETION',
  STREAK = 'STREAK',
  POINTS_MILESTONE = 'POINTS_MILESTONE',
  LEVEL_UP = 'LEVEL_UP',
  SPECIAL_EVENT = 'SPECIAL_EVENT',
}

/**
 * Badge Rarity
 */
export enum BadgeRarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

// ==================== Certificates ====================

/**
 * Certificate Status
 */
export enum CertificateStatus {
  PENDING = 'PENDING',
  ISSUED = 'ISSUED',
  REVOKED = 'REVOKED',
}

// ==================== Reviews & Ratings ====================

/**
 * Review Status
 */
export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED',
}

// ==================== Forums & Discussions ====================

/**
 * Discussion Status
 */
export enum DiscussionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  PINNED = 'PINNED',
  LOCKED = 'LOCKED',
}

/**
 * Comment Status
 */
export enum CommentStatus {
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
  FLAGGED = 'FLAGGED',
  DELETED = 'DELETED',
}

// ==================== System ====================

/**
 * Log Level
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly',
}

/**
 * Environment
 */
export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test',
}
