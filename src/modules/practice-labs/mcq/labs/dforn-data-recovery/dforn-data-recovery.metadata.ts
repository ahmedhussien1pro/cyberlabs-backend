// src/modules/practice-labs/mcq/labs/dforn-data-recovery/dforn-data-recovery.metadata.ts
import type { MCQLabMetadata } from '../../../types/mcq-lab-metadata.type';

export const dfornDataRecoveryMCQMetadata: MCQLabMetadata = {
  slug:          'mcq-dforn-data-recovery',
  jsonFile:      'labs_assets/MCQ-data/digital_Forn/DataRecovery.json',
  questionCount: 20,
  passingScore:  70,

  title:          'Data Recovery Forensics Quiz',
  ar_title:       'اختبار جنائيات استرداد البيانات',
  description:    'Test your knowledge of data recovery techniques, deleted file restoration, and forensic tools.',
  ar_description: 'اختبر معرفتك بتقنيات استرداد البيانات واستعادة الملفات المحذوفة والأدوات الجنائية.',
  goal:           'Answer at least 14 out of 20 questions correctly to capture the flag.',
  ar_goal:        'أجب على 14 سؤال من أصل 20 بشكل صحيح للحصول على العلم.',

  difficulty:   'INTERMEDIATE',
  category:     'WEB_SECURITY',
  skills:       ['Data Recovery', 'File Carving', 'Forensic Tools'],

  xpReward:     150,
  pointsReward: 100,
  duration:     15,
  isPublished:  true,
};
