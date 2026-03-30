// src/modules/practice-labs/shared/interfaces/scenario-spec.interface.ts
// TypeScript interface for the Scenario Spec JSON (Lab Blueprint input)
// Used by PR #3: ScenarioSpecEngine + LabBlueprintEngine

export type VulnerabilityDomain =
  | 'WEB_SECURITY'
  | 'PENETRATION_TESTING'
  | 'MALWARE_ANALYSIS'
  | 'CLOUD_SECURITY'
  | 'FUNDAMENTALS'
  | 'CRYPTOGRAPHY'
  | 'NETWORK_SECURITY'
  | 'TOOLS_AND_TECHNIQUES'
  | 'CAREER_AND_INDUSTRY';

export type FlagPolicyType =
  | 'PER_USER_PER_LAB'
  | 'PER_USER_PER_ATTEMPT'
  | 'PER_SESSION';

export type HintPenaltyMode = 'PERCENTAGE' | 'FIXED_XP';

export type HintType = 'conceptual' | 'narrowing' | 'final_push';

export interface ScenarioHintSpec {
  /** 1 = conceptual (general), 2 = narrowing, 3 = final_push */
  order: 1 | 2 | 3;
  type: HintType;
  /** Student-facing hint content (English) */
  content: string;
  /** Student-facing hint content (Arabic) */
  ar_content?: string;
  /** Penalty percentage deducted from score when this hint is used */
  penalty: number;
}

export interface ScenarioScoringRules {
  base_points: number;
  base_xp: number;
  hint_penalty_mode: HintPenaltyMode;
  time_bonus: boolean;
}

export interface ScenarioFlagValidation {
  policy: FlagPolicyType;
  /** e.g. "FLAG{SLUG_[USER_HASH]_[SESSION_HASH]}" */
  format: string;
  dynamic: boolean;
}

export interface ScenarioSpec {
  /** Human-readable lab name */
  name: string;
  /** Slug — must match the DB lab slug */
  slug: string;
  vulnerability_type: string;
  domain: VulnerabilityDomain;
  /** Clear educational objective — what the student learns */
  educational_objective: string;
  /** Arabic version of the educational objective */
  ar_educational_objective?: string;
  /** Prerequisite lab slugs or concept IDs */
  prerequisites: string[];
  /** Exactly 3 hints: conceptual → narrowing → final_push */
  hints_metadata: [ScenarioHintSpec, ScenarioHintSpec, ScenarioHintSpec];
  scoring_rules: ScenarioScoringRules;
  flag_validation: ScenarioFlagValidation;
  /** Docker image / environment template key */
  environment_template: string;
  /** Path to admin-only solution doc (relative to repo root) */
  hidden_solution_path: string;
}
