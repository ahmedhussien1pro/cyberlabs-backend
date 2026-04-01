// src/modules/practice-labs/types/mcq-lab-metadata.type.ts
//
// DESIGN:
// - questions? is OPTIONAL — metadata files that don't embed questions are valid.
// - The seed script is the only place that reads JSON files (via fs).
// - mcq.service reads questions from DB initialState.questions at runtime.
// - Zero filesystem I/O on Vercel Serverless runtime.

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

export interface MCQQuestion {
  id:       number;
  question: string;
  options:  string[];
  answer:   string;
}

export interface MCQLabMetadata {
  /** Unique DB slug — used as the route key */
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
  category:   MCQCategory;

  /** Skills / tags shown on the card */
  skills: string[];

  /**
   * Path to the JSON file relative to prisma/seed-data/mcq-labs/data/.
   * Used ONLY by the seed script (fs.readFileSync) — never at runtime.
   */
  jsonFile: string;

  /**
   * OPTIONAL inline question bank.
   * If provided → seed uses these directly.
   * If omitted  → seed reads from jsonFile automatically.
   * mcq.service ALWAYS reads from DB — never from this field.
   */
  questions?: MCQQuestion[];

  /** Total number of questions (used for display / scoring calc) */
  questionCount: number;

  /** Minimum pass percentage (0–100) to earn the flag */
  passingScore: number;

  /** XP awarded on completion */
  xpReward: number;

  /** Points awarded on completion */
  pointsReward: number;

  /** Estimated minutes to complete */
  duration: number;

  isPublished: boolean;
}
