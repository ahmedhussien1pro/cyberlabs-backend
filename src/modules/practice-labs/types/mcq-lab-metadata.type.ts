// src/modules/practice-labs/types/mcq-lab-metadata.type.ts
// Lightweight metadata interface used by all MCQ labs.
// Every MCQ lab = one JSON file in labs_assets/MCQ-data/**/*.json
// Only these fields differ between labs; everything else is template-driven.

export type MCQDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type MCQCategory =
  | 'WEB_SECURITY'
  | 'PENETRATION_TESTING'
  | 'DIGITAL_FORENSICS'
  | 'CAREER_AND_INDUSTRY'
  | 'NETWORK_SECURITY'
  | 'CLOUD_SECURITY'
  | 'FUNDAMENTALS'
  | 'TOOLS_AND_TECHNIQUES';

export interface MCQLabMetadata {
  /** Unique DB slug — used as the route key and JSON file locator */
  slug: string;

  /** Display title shown on the lab card and inside the quiz */
  title: string;
  ar_title: string;

  /** Short description for the lab card */
  description: string;
  ar_description: string;

  /** Goal sentence shown on the idle screen */
  goal: string;
  ar_goal: string;

  difficulty: MCQDifficulty;
  category: MCQCategory;

  /** Skills / tags shown on the card */
  skills: string[];

  /** Relative path from the repo root to the source JSON */
  jsonFile: string;

  /** Number of questions in the JSON (for seed metadata display) */
  questionCount: number;

  /** Minimum correct answers (percentage 0–100) to earn the flag */
  passingScore: number;

  /** XP awarded on completion */
  xpReward: number;

  /** Points awarded on completion */
  pointsReward: number;

  /** Estimated minutes to complete */
  duration: number;

  isPublished: boolean;
}
