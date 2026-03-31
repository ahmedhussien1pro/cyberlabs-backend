// src/modules/practice-labs/mcq/labs/dforn-email/dforn-email.metadata.ts
import type { MCQLabMetadata } from '../../../types/mcq-lab-metadata.type';

export const dfornEmailMCQMetadata: MCQLabMetadata = {
  slug:          'mcq-dforn-email',
  jsonFile:      'digital_Forn/Email.json',
  questionCount: 20,
  passingScore:  70,

  title:          'Email Forensics Quiz',
  ar_title:       'اختبار جنائيات البريد الإلكتروني',
  description:    'Explore email header analysis, phishing investigation, and email forensics tools.',
  ar_description: 'استكشف تحليل رأس البريد الإلكتروني والتحقيق في التصيد الاحتيالي وأدوات جنائيات البريد.',
  goal:           'Answer at least 14 out of 20 questions correctly to capture the flag.',
  ar_goal:        'أجب على 14 سؤال من أصل 20 بشكل صحيح للحصول على العلم.',

  difficulty:   'BEGINNER',
  category:     'WEB_SECURITY',
  skills:       ['Email Forensics', 'Header Analysis', 'Phishing Investigation'],

  xpReward:     100,
  pointsReward: 100,
  duration:     15,
  isPublished:  true,
};
