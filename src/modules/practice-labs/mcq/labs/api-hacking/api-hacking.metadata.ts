// src/modules/practice-labs/mcq/labs/api-hacking/api-hacking.metadata.ts
import type { MCQLabMetadata } from '../../../types/mcq-lab-metadata.type';

/**
 * MCQ Lab — API Hacking Quiz
 *
 * JSON file : labs_assets/MCQ-data/API_Hacking.json
 * Questions : 20
 * Passing   : 70% (14 / 20)
 * Points    : 5 per correct answer  →  max 100 pts
 */
export const apiHackingMCQMetadata: MCQLabMetadata = {
  // ─── Identity ───────────────────────────────────────────────────────────────
  slug:            'mcq-api-hacking',
  jsonFile:        'labs_assets/MCQ-data/API_Hacking.json',
  questionCount:   20,
  passingScore:    70, // %

  // ─── Display ────────────────────────────────────────────────────────────────
  title:          'API Hacking Quiz',
  ar_title:       'اختبار اختراق الـ API',

  description:
    'Test your knowledge of REST APIs, HTTP methods, authentication, and common API vulnerabilities.',
  ar_description:
    'اختبر معرفتك بـ REST APIs وأساليب HTTP والمصادقة والثغرات الشائعة في الـ API.',

  goal:
    'Answer at least 14 out of 20 questions correctly to capture the flag.',
  ar_goal:
    'أجب على 14 سؤال من أصل 20 بشكل صحيح للحصول على العلم.',

  // ─── Classification ─────────────────────────────────────────────────────────
  difficulty: 'BEGINNER',
  category:   'WEB_SECURITY',
  skills:     [
    'REST API',
    'HTTP Methods',
    'API Authentication',
    'API Security',
    'Rate Limiting',
    'GraphQL',
  ],

  // ─── Rewards ────────────────────────────────────────────────────────────────
  xpReward:      100,
  pointsReward:  100, // 5 pts × 20 questions
  duration:      15,  // minutes
  isPublished:   true,
};
