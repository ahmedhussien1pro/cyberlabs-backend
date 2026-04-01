/**
 * vm-labs.types.ts — shared TypeScript types used by both backend services
 * and exported to the frontend via the API types package.
 *
 * Keep this file import-free from NestJS/Prisma decorators so it can be
 * re-exported without side effects.
 */

import type {
  VmInstanceStatus,
  VmProviderType,
  VmOsType,
  VmNetworkMode,
  VmLabEventType,
} from '@prisma/client';

// ── Template summary returned in catalogue listings ───────────────────────

export interface VmLabTemplateSummary {
  id: string;
  slug: string;
  title: string;
  ar_title?: string;
  description?: string;
  osType: VmOsType;
  networkMode: VmNetworkMode;
  providerType: VmProviderType;
  maxDurationMin: number;
  estimatedDurationMin: number;
  toolsIncluded: string[];
  poolStatus: 'AVAILABLE' | 'QUEUED' | 'AT_CAPACITY';
  availableSlots: number;
  estimatedWaitMin: number | null;
}

// ── Full instance details returned to the student after launch ───────────

export interface VmLabInstanceDetail {
  instanceId: string;
  status: VmInstanceStatus;
  accessUrl: string;
  sshHost?: string;
  sshPort?: number;
  expiresAt: string; // ISO 8601
  remainingMin: number;
  hintsUnlocked: number;
  flagSubmitted: boolean;
  currentScore: number;
}

// ── Real-time events pushed over WebSocket ────────────────────────────

export type VmLabWsEvent =
  | { type: 'INSTANCE_STATUS_CHANGED'; instanceId: string; status: VmInstanceStatus }
  | { type: 'SESSION_EXTENDED'; instanceId: string; newExpiresAt: string; remainingMin: number }
  | { type: 'FLAG_CORRECT'; instanceId: string; xpAwarded: number; pointsAwarded: number }
  | { type: 'FLAG_WRONG'; instanceId: string; attemptsLeft: number | null }
  | { type: 'HINT_UNLOCKED'; instanceId: string; hintOrder: number; penaltyApplied: number }
  | { type: 'HEALTH_CHECK_FAILED'; instanceId: string; errorMessage?: string };

// ── Flag submission response ─────────────────────────────────────────────

export interface FlagSubmitResult {
  correct: boolean;
  /** Final XP awarded after hint penalties (0 if wrong) */
  xpAwarded: number;
  /** Final points awarded after hint penalties (0 if wrong) */
  pointsAwarded: number;
  /** Score 0–100 considering hints used */
  finalScore: number;
  message: string;
  ar_message?: string;
}

// ── Admin stats snapshot (used by admin panel) ─────────────────────────

export interface VmLabAdminStats {
  totalInstances: number;
  runningInstances: number;
  queuedInstances: number;
  errorInstances: number;
  avgSessionDurationMin: number;
  uniqueUsers24h: number;
}

// ── Event audit record ───────────────────────────────────────────────

export interface VmLabEventRecord {
  id: string;
  instanceId: string;
  eventType: VmLabEventType;
  meta?: Record<string, unknown>;
  createdAt: string;
}
