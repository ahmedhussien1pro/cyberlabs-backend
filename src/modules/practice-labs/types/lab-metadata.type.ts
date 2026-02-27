// src/modules/practice-labs/types/lab-metadata.type.ts

export interface LabScenario {
  context: string;
  vulnerableCode?: string;
  exploitation: string;
}

export interface LabHintSeed {
  order: number;
  xpCost: number;
  content: string;
}

export interface LabMetadata {
  // ─── Bilingual Card Fields ───────────────────────────────────
  slug: string;
  title: string;
  ar_title: string;
  description: string;
  ar_description: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  category:
    | 'WEB_SECURITY'
    | 'PENETRATION_TESTING'
    | 'MALWARE_ANALYSIS'
    | 'CLOUD_SECURITY'
    | 'FUNDAMENTALS'
    | 'CRYPTOGRAPHY'
    | 'NETWORK_SECURITY'
    | 'TOOLS_AND_TECHNIQUES'
    | 'CAREER_AND_INDUSTRY';
  skills: string[];
  xpReward: number;
  pointsReward: number;
  duration: number;
  executionMode: 'FRONTEND' | 'SHARED_BACKEND' | 'DOCKER';
  isPublished: boolean;
  imageUrl?: string;
  // ─── Lab Platform Fields (EN only) ──────────────────────────
  goal: string;
  scenario?: LabScenario;
  hints: LabHintSeed[];

  // ─── Seed Data ───────────────────────────────────────────────
  flagAnswer: string;
  initialState: Record<string, any>;
}
