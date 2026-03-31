// src/modules/practice-labs/mcq/labs/dforn-drone/dforn-drone.metadata.ts
import type { MCQLabMetadata } from '../../../types/mcq-lab-metadata.type';

export const dfornDroneMCQMetadata: MCQLabMetadata = {
  slug:          'mcq-dforn-drone',
  jsonFile:      'labs_assets/MCQ-data/digital_Forn/Drone.json',
  questionCount: 20,
  passingScore:  70,

  title:          'Drone Forensics Quiz',
  ar_title:       'اختبار جنائيات الطائرات المسيّرة',
  description:    'Test your knowledge of drone forensics, flight logs, and UAV evidence collection.',
  ar_description: 'اختبر معرفتك بجنائيات الطائرات المسيّرة وسجلات الطيران وجمع أدلة UAV.',
  goal:           'Answer at least 14 out of 20 questions correctly to capture the flag.',
  ar_goal:        'أجب على 14 سؤال من أصل 20 بشكل صحيح للحصول على العلم.',

  difficulty:   'INTERMEDIATE',
  category:     'WEB_SECURITY',
  skills:       ['Drone Forensics', 'UAV', 'Flight Log Analysis'],

  xpReward:     150,
  pointsReward: 100,
  duration:     15,
  isPublished:  true,
};
