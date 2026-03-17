// src/modules/practice-labs/types/lab.types.ts
// ───────────────────────────────────────────────────────────────────────
// Typed enums & interfaces — replaces all `(x as any).field` usage
// ───────────────────────────────────────────────────────────────────────

export type FlagPolicyType =
  | 'PER_USER_PER_LAB'      // one flag per user, bound to (userId + labId)
  | 'PER_USER_PER_ATTEMPT'  // fresh flag every launch, bound to instanceId
  | 'PER_SESSION';          // alias for PER_USER_PER_ATTEMPT (Docker-based labs)

export type HintPenaltyMode =
  | 'PERCENTAGE'  // deduct N% of final reward per hint used
  | 'FIXED_XP'   // deduct fixed XP per hint at unlock time
  | 'NONE';       // hints are free

export type ExecutionMode =
  | 'GUIDED'  // step-by-step walkthroughs with feedback
  | 'FREE';   // open-ended — user explores on their own

export type EnvironmentType =
  | 'DEFAULT'  // runs inside the labs frontend (React sandbox)
  | 'DOCKER'   // spins up a real Docker container
  | 'BROWSER'; // browser-based simulation

export type LabDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export type LabCategory =
  | 'WEB_SECURITY'
  | 'PENETRATION_TESTING'
  | 'MALWARE_ANALYSIS'
  | 'CLOUD_SECURITY'
  | 'FUNDAMENTALS'
  | 'CRYPTOGRAPHY'
  | 'NETWORK_SECURITY'
  | 'TOOLS_AND_TECHNIQUES'
  | 'CAREER_AND_INDUSTRY';

// ── Full lab record with relations needed by practice-labs.service.ts ───────

export interface UserLabProgressRecord {
  id: string;
  flagSubmitted: boolean;
  attempts: number;
  startedAt: Date;
  lastAccess: Date;
  completedAt: Date | null;
  hintsUsed: number;
  progress: number;
}

export interface LabHintRecord {
  id: string;
  order: number;
  xpCost: number;
  penaltyPercent: number;
  content: string;
  ar_content: string;
}

export interface LabWithPolicy {
  id: string;
  title: string;
  ar_title: string;
  slug: string;
  difficulty: LabDifficulty;
  category: LabCategory;
  executionMode: ExecutionMode;
  environmentType: EnvironmentType;
  flagPolicyType: FlagPolicyType;
  hintPenaltyMode: HintPenaltyMode;
  xpReward: number;
  pointsReward: number;
  isPublished: boolean;
  usersProgress: UserLabProgressRecord[];
  hints?: LabHintRecord[];
}

// ── Lightweight version returned from launchLab() ──────────────────────

export interface LabLaunchInfo {
  id: string;
  slug: string;
  title: string;
  executionMode: ExecutionMode;
  environmentType: EnvironmentType;
  flagPolicyType: FlagPolicyType;
}
