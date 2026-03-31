// src/modules/practice-labs/mcq/labs/dforn-computer/dforn-computer.metadata.ts
import type { MCQLabMetadata } from '../../../types/mcq-lab-metadata.type';

export const dfornComputerMCQMetadata: MCQLabMetadata = {
  slug:          'mcq-dforn-computer',
  jsonFile:      'labs_assets/MCQ-data/digital_Forn/Computer.json',
  questionCount: 20,
  passingScore:  70,

  title:          'Computer Forensics Quiz',
  ar_title:       'اختبار الجنائيات الحاسوبية',
  description:    'Test your understanding of computer forensics, disk imaging, and file system analysis.',
  ar_description: 'اختبر فهمك للجنائيات الحاسوبية وصور الأقراص وتحليل نظام الملفات.',
  goal:           'Answer at least 14 out of 20 questions correctly to capture the flag.',
  ar_goal:        'أجب على 14 سؤال من أصل 20 بشكل صحيح للحصول على العلم.',

  difficulty:   'BEGINNER',
  category:     'WEB_SECURITY',
  skills:       ['Computer Forensics', 'Disk Imaging', 'File System Analysis'],

  xpReward:     100,
  pointsReward: 100,
  duration:     15,
  isPublished:  true,
};
