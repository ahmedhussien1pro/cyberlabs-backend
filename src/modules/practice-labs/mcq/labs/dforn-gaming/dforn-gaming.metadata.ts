// src/modules/practice-labs/mcq/labs/dforn-gaming/dforn-gaming.metadata.ts
import type { MCQLabMetadata } from '../../../types/mcq-lab-metadata.type';

export const dfornGamingMCQMetadata: MCQLabMetadata = {
  slug:          'mcq-dforn-gaming',
  jsonFile:      'digital_Forn/Gaming.json',
  questionCount: 20,
  passingScore:  70,

  title:          'Gaming Forensics Quiz',
  ar_title:       'اختبار جنائيات الألعاب',
  description:    'Test your knowledge of digital forensics in gaming platforms, cheating artifacts, and game logs.',
  ar_description: 'اختبر معرفتك بالجنائيات الرقمية في منصات الألعاب وأثار الغش وسجلات الألعاب.',
  goal:           'Answer at least 14 out of 20 questions correctly to capture the flag.',
  ar_goal:        'أجب على 14 سؤال من أصل 20 بشكل صحيح للحصول على العلم.',

  difficulty:   'BEGINNER',
  category:     'WEB_SECURITY',
  skills:       ['Gaming Forensics', 'Artifact Analysis', 'Game Log Analysis'],

  xpReward:     100,
  pointsReward: 100,
  duration:     15,
  isPublished:  true,
};
