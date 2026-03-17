// src/modules/practice-labs/types/lab-metadata.type.ts

export interface BilingualText {
  en: string;
  ar: string;
}

export interface BilingualSteps {
  en: string[];
  ar: string[];
}

export interface LabSolution {
  context: string;
  vulnerableCode: string;
  exploitation: string;
  steps: BilingualSteps;
  fix: string[];
}

export interface LabPostSolve {
  explanation: BilingualText;
  impact: BilingualText;
  fix: string[];
}

export interface LabHintSeed {
  order: number;
  xpCost: number;
  content: string;
  ar_content?: string;
}

// ─── New: MissionBrief (used by MissionBriefDialog) ─────────────────────────
export type LabClassification =
  | 'UNCLASSIFIED'
  | 'CONFIDENTIAL'
  | 'SECRET'
  | 'TOP_SECRET';

export interface LabMissionBrief {
  codename?: string;
  classification?: LabClassification;
  objective: string;
  ar_objective?: string;
  background?: string;
  ar_background?: string;
  successCriteria?: string[];
  ar_successCriteria?: string[];
  warningNote?: string;
}

// ─── New: LabInfo (used by LabInfoDialog) ────────────────────────────────────
export interface LabInfoReference {
  label: string;
  url: string;
}

export interface LabInfoData {
  vulnType: string;
  ar_vulnType?: string;
  cweId?: string;
  cvssScore?: number;
  description: string;
  ar_description?: string;
  whatYouLearn?: string[];
  ar_whatYouLearn?: string[];
  techStack?: string[];
  references?: LabInfoReference[];
}

// ─── Environment type — maps to a React environment component ────────────────
export type LabEnvironmentType =
  | 'LOGIN_FORM'
  | 'ECOMMERCE'
  | 'BLOG_CMS'
  | 'PORTAL_AUTH'
  | 'BANKING_DASHBOARD'
  | 'BANKING_PORTAL'
  | 'BANKING_APP'
  | 'GENERIC'
  | 'STREAMING_PLATFORM'
  | 'TRAVEL_BOOKING'
  | 'HEALTHCARE_PORTAL'
  | 'CORPORATE_SSO'
  | 'LOGISTICS'
  | 'DEVELOPER_PLATFORM'
  | 'PROJECT_MANAGEMENT'
  | 'ANALYTICS_SAAS';

// ─── Main LabMetadata ────────────────────────────────────────────────────────
export interface LabMetadata {
  // ─── Bilingual Card Fields ────────────────────────────────────
  slug: string;
  title: string;
  ar_title: string;
  description: string;
  ar_description: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
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

  // ─── Grouping & inventory ─────────────────────────────────────
  canonicalConceptId?: string;
  environmentType?: LabEnvironmentType;

  // ─── Lab Platform Fields ────────────────────────────────────────
  goal: string;
  ar_goal: string;
  briefing: BilingualText;
  stepsOverview: BilingualSteps;

  // ─── Dialog content (optional — used by new dialog components) ──
  missionBrief?: LabMissionBrief;
  labInfo?: LabInfoData;

  // ─── Admin Only ─────────────────────────────────────────────────
  solution: LabSolution;

  // ─── Post Solve ─────────────────────────────────────────────────
  postSolve: LabPostSolve;

  // ─── Hints ──────────────────────────────────────────────────────
  hints: LabHintSeed[];

  // ─── Seed Data ──────────────────────────────────────────────────
  flagAnswer: string;
  initialState: Record<string, any>;
}
