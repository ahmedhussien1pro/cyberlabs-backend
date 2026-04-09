// src/modules/vm-labs/vm-labs.types.ts
// ─── Shared types for the vm-labs module ────────────────────────────────────────
// These mirror cyberlabs-frontend-labs/src/features/lab-session/types/vm-lab.types.ts
// Keep in sync when adding new fields.

export type VmLabStatus =
  | 'QUEUED'
  | 'STARTING'
  | 'RUNNING'
  | 'STOPPING'
  | 'STOPPED'
  | 'FAILED'
  | 'EXPIRED';

/** Shape of the instance object returned by vm-service REST calls */
export interface VmServiceInstance {
  instanceId:      string;
  labId?:          string;
  status:          VmLabStatus;
  accessUrl:       string | null;
  sshCredentials?: {
    host:     string;
    port:     number;
    username: string;
    password: string;
  } | null;
  expiresAt:        string | null;
  secondsRemaining?: number;
  extensionsUsed:   number;
  maxExtensions:    number;
}

/** WS events pushed from vm-service (or our gateway) to the frontend */
export type VmLabWsEventType =
  | 'PROVISIONING'
  | 'RUNNING'
  | 'STOPPED'
  | 'EXPIRED'
  | 'ERROR'
  | 'TTL_UPDATE'
  | 'FLAG_RESULT';

export interface VmLabWsEvent {
  type:             VmLabWsEventType;
  instanceId:       string;
  status?:          VmLabStatus;
  accessUrl?:       string;
  secondsRemaining?: number;
  message?:         string;
  flagCorrect?:     boolean;
  finalScore?:      number;
}

/** Result of flag submission */
export interface VmFlagSubmitResult {
  correct:      boolean;
  finalScore:   number;
  isFirstSolve: boolean;
  message:      string;
}

/** VmLabTemplate as returned by Prisma (platform side) */
export interface VmLabTemplate {
  id:          string;
  slug:        string;
  title:       string;
  description: string;
  difficulty:  'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  category:    string;
  isActive:    boolean;
  maxDurationMinutes: number;
  createdAt:   string;
  updatedAt:   string;
}
