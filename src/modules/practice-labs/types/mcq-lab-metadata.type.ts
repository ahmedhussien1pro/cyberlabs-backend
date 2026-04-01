// src/modules/practice-labs/types/mcq-lab-metadata.type.ts
// Lightweight metadata interface used by all MCQ labs.
// Each MCQ lab embeds its questions directly in DB initialState.
// No file-system reads needed at runtime — safe for Vercel Serverless.

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
  category: MCQCategory;

  /** Skills / tags shown on the card */
  skills: string[];

  /**
   * Relative path from data/ folder — kept for backwards compat
   * and local dev reference. NOT read at runtime.
   */
  jsonFile: string;

  /**
   * Full question bank embedded directly in the metadata.
   * Seed script writes these into DB initialState.questions.
   * mcq.service reads from DB — zero filesystem I/O on Vercel.
   */
  questions: MCQQuestion[];

  /** Number of questions (derived from questions.length, kept for display) */
  questionCount: number;

  /** Minimum percentage (0–100) to earn the flag */
  passingScore: number;

  /** XP awarded on completion */
  xpReward: number;

  /** Points awarded on completion */
  pointsReward: number;

  /** Estimated minutes to complete */
  duration: number;

  isPublished: boolean;
}
