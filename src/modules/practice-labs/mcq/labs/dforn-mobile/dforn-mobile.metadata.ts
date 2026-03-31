// src/modules/practice-labs/mcq/labs/dforn-mobile/dforn-mobile.metadata.ts
import type { MCQLabMetadata } from '../../../types/mcq-lab-metadata.type';

export const dfornMobileMCQMetadata: MCQLabMetadata = {
  slug:          'mcq-dforn-mobile',
  jsonFile:      'digital_Forn/Mobile.json',
  questionCount: 20,
  passingScore:  70,

  title:          'Mobile Forensics Quiz',
  ar_title:       'اختبار جنائيات الهواتف المحمولة',
  description:    'Test your knowledge of mobile forensics, Android/iOS evidence extraction, and app data analysis.',
  ar_description: 'اختبر معرفتك بجنائيات الهواتف المحمولة واستخراج الأدلة من Android/iOS وتحليل بيانات التطبيقات.',
  goal:           'Answer at least 14 out of 20 questions correctly to capture the flag.',
  ar_goal:        'أجب على 14 سؤال من أصل 20 بشكل صحيح للحصول على العلم.',

  difficulty:   'INTERMEDIATE',
  category:     'WEB_SECURITY',
  skills:       ['Mobile Forensics', 'Android Forensics', 'iOS Forensics'],

  xpReward:     150,
  pointsReward: 100,
  duration:     15,
  isPublished:  true,
};
