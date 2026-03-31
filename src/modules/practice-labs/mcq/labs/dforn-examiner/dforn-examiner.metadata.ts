// src/modules/practice-labs/mcq/labs/dforn-examiner/dforn-examiner.metadata.ts
import type { MCQLabMetadata } from '../../../types/mcq-lab-metadata.type';

export const dfornExaminerMCQMetadata: MCQLabMetadata = {
  slug:          'mcq-dforn-examiner',
  jsonFile:      'digital_Forn/DigitalForensicsExaminer.json',
  questionCount: 20,
  passingScore:  70,

  title:          'Digital Forensics Examiner Quiz',
  ar_title:       'اختبار فاحص الجنائيات الرقمية',
  description:    'Test the core competencies required of a certified digital forensics examiner.',
  ar_description: 'اختبر الكفاءات الأساسية المطلوبة لفاحص الجنائيات الرقمية المعتمد.',
  goal:           'Answer at least 14 out of 20 questions correctly to capture the flag.',
  ar_goal:        'أجب على 14 سؤال من أصل 20 بشكل صحيح للحصول على العلم.',

  difficulty:   'INTERMEDIATE',
  category:     'WEB_SECURITY',
  skills:       ['Digital Forensics', 'Chain of Custody', 'Evidence Handling'],

  xpReward:     150,
  pointsReward: 100,
  duration:     15,
  isPublished:  true,
};
