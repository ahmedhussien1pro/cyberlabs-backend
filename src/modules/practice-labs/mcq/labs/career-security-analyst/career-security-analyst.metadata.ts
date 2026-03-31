// src/modules/practice-labs/mcq/labs/career-security-analyst/career-security-analyst.metadata.ts
import type { MCQLabMetadata } from '../../../types/mcq-lab-metadata.type';

export const careerSecurityAnalystMCQMetadata: MCQLabMetadata = {
  slug:          'mcq-career-security-analyst',
  jsonFile:      'career_in_Cyber/SecurityAnalyst.json',
  questionCount: 20,
  passingScore:  70,

  title:          'Security Analyst Career Quiz',
  ar_title:       'اختبار مسار محلل الأمن',
  description:    'Assess your knowledge of SOC operations, threat detection, and security monitoring.',
  ar_description: 'قيّم معرفتك بعمليات SOC واكتشاف التهديدات ومراقبة الأمن.',
  goal:           'Answer at least 14 out of 20 questions correctly to capture the flag.',
  ar_goal:        'أجب على 14 سؤال من أصل 20 بشكل صحيح للحصول على العلم.',

  difficulty:   'BEGINNER',
  category:     'WEB_SECURITY',
  skills:       ['SOC', 'Threat Detection', 'Security Monitoring', 'SIEM'],

  xpReward:     100,
  pointsReward: 100,
  duration:     15,
  isPublished:  true,
};
