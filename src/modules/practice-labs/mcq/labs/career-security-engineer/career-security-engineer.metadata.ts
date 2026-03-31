// src/modules/practice-labs/mcq/labs/career-security-engineer/career-security-engineer.metadata.ts
import type { MCQLabMetadata } from '../../../types/mcq-lab-metadata.type';

export const careerSecurityEngineerMCQMetadata: MCQLabMetadata = {
  slug:          'mcq-career-security-engineer',
  jsonFile:      'labs_assets/MCQ-data/career_in_Cyber/SecurityEngineer.json',
  questionCount: 20,
  passingScore:  70,

  title:          'Security Engineer Career Quiz',
  ar_title:       'اختبار مسار مهندس الأمن',
  description:    'Test your knowledge of security architecture, hardening, and engineering practices.',
  ar_description: 'اختبر معرفتك ببنية الأمن والتصليب وممارسات هندسة الأمن.',
  goal:           'Answer at least 14 out of 20 questions correctly to capture the flag.',
  ar_goal:        'أجب على 14 سؤال من أصل 20 بشكل صحيح للحصول على العلم.',

  difficulty:   'INTERMEDIATE',
  category:     'WEB_SECURITY',
  skills:       ['Security Architecture', 'System Hardening', 'DevSecOps'],

  xpReward:     150,
  pointsReward: 100,
  duration:     15,
  isPublished:  true,
};
