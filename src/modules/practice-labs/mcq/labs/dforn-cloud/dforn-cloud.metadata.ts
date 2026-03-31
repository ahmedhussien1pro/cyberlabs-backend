// src/modules/practice-labs/mcq/labs/dforn-cloud/dforn-cloud.metadata.ts
import type { MCQLabMetadata } from '../../../types/mcq-lab-metadata.type';

export const dfornCloudMCQMetadata: MCQLabMetadata = {
  slug:          'mcq-dforn-cloud',
  jsonFile:      'labs_assets/MCQ-data/digital_Forn/Cloud.json',
  questionCount: 20,
  passingScore:  70,

  title:          'Cloud Forensics Quiz',
  ar_title:       'اختبار جنائيات السحابة',
  description:    'Assess your knowledge of cloud forensics, log analysis, and evidence collection in cloud environments.',
  ar_description: 'قيّم معرفتك بجنائيات السحابة وتحليل السجلات وجمع الأدلة في البيئات السحابية.',
  goal:           'Answer at least 14 out of 20 questions correctly to capture the flag.',
  ar_goal:        'أجب على 14 سؤال من أصل 20 بشكل صحيح للحصول على العلم.',

  difficulty:   'INTERMEDIATE',
  category:     'WEB_SECURITY',
  skills:       ['Cloud Forensics', 'Log Analysis', 'AWS', 'Azure'],

  xpReward:     150,
  pointsReward: 100,
  duration:     15,
  isPublished:  true,
};
