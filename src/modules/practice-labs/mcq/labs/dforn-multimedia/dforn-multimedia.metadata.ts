// src/modules/practice-labs/mcq/labs/dforn-multimedia/dforn-multimedia.metadata.ts
import type { MCQLabMetadata } from '../../../types/mcq-lab-metadata.type';

export const dfornMultimediaMCQMetadata: MCQLabMetadata = {
  slug:          'mcq-dforn-multimedia',
  jsonFile:      'digital_Forn/Multimedia.json',
  questionCount: 20,
  passingScore:  70,

  title:          'Multimedia Forensics Quiz',
  ar_title:       'اختبار جنائيات الوسائط المتعددة',
  description:    'Explore image/video forensics, steganography detection, and metadata analysis in multimedia files.',
  ar_description: 'استكشف جنائيات الصور/الفيديو واكتشاف الإخفاء وتحليل البيانات الوصفية في ملفات الوسائط.',
  goal:           'Answer at least 14 out of 20 questions correctly to capture the flag.',
  ar_goal:        'أجب على 14 سؤال من أصل 20 بشكل صحيح للحصول على العلم.',

  difficulty:   'BEGINNER',
  category:     'WEB_SECURITY',
  skills:       ['Multimedia Forensics', 'Steganography', 'Metadata Analysis'],

  xpReward:     100,
  pointsReward: 100,
  duration:     15,
  isPublished:  true,
};
