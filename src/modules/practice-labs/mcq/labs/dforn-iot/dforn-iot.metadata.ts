// src/modules/practice-labs/mcq/labs/dforn-iot/dforn-iot.metadata.ts
import type { MCQLabMetadata } from '../../../types/mcq-lab-metadata.type';

export const dfornIotMCQMetadata: MCQLabMetadata = {
  slug:          'mcq-dforn-iot',
  jsonFile:      'digital_Forn/IoT.json',
  questionCount: 20,
  passingScore:  70,

  title:          'IoT Forensics Quiz',
  ar_title:       'اختبار جنائيات إنترنت الأشياء',
  description:    'Explore forensic techniques for IoT devices, firmware analysis, and embedded system investigation.',
  ar_description: 'استكشف التقنيات الجنائية لأجهزة إنترنت الأشياء وتحليل البرامج الثابتة والتحقيق في الأنظمة المدمجة.',
  goal:           'Answer at least 14 out of 20 questions correctly to capture the flag.',
  ar_goal:        'أجب على 14 سؤال من أصل 20 بشكل صحيح للحصول على العلم.',

  difficulty:   'INTERMEDIATE',
  category:     'WEB_SECURITY',
  skills:       ['IoT Forensics', 'Firmware Analysis', 'Embedded Systems'],

  xpReward:     150,
  pointsReward: 100,
  duration:     15,
  isPublished:  true,
};
