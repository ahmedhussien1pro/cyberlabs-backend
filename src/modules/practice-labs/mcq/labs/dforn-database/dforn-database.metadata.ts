// src/modules/practice-labs/mcq/labs/dforn-database/dforn-database.metadata.ts
import type { MCQLabMetadata } from '../../../types/mcq-lab-metadata.type';

export const dfornDatabaseMCQMetadata: MCQLabMetadata = {
  slug:          'mcq-dforn-database',
  jsonFile:      'digital_Forn/Database.json',
  questionCount: 20,
  passingScore:  70,

  title:          'Database Forensics Quiz',
  ar_title:       'اختبار جنائيات قواعد البيانات',
  description:    'Explore database forensics techniques, query logs, and evidence extraction from DBMS.',
  ar_description: 'استكشف تقنيات جنائيات قواعد البيانات وسجلات الاستعلام واستخراج الأدلة من نظم إدارة قواعد البيانات.',
  goal:           'Answer at least 14 out of 20 questions correctly to capture the flag.',
  ar_goal:        'أجب على 14 سؤال من أصل 20 بشكل صحيح للحصول على العلم.',

  difficulty:   'INTERMEDIATE',
  category:     'WEB_SECURITY',
  skills:       ['Database Forensics', 'SQL', 'Log Analysis'],

  xpReward:     150,
  pointsReward: 100,
  duration:     15,
  isPublished:  true,
};
