// src/modules/practice-labs/mcq/labs/career-red-teamer/career-red-teamer.metadata.ts
import type { MCQLabMetadata } from '../../../types/mcq-lab-metadata.type';

export const careerRedTeamerMCQMetadata: MCQLabMetadata = {
  slug:          'mcq-career-red-teamer',
  jsonFile:      'career_in_Cyber/RedTeamer.json',
  questionCount: 20,
  passingScore:  70,

  title:          'Red Teamer Career Quiz',
  ar_title:       'اختبار مسار الفريق الأحمر',
  description:    'Test your understanding of Red Team operations, adversary simulation, and offensive security.',
  ar_description: 'اختبر فهمك لعمليات الفريق الأحمر ومحاكاة المهاجمين والأمن الهجومي.',
  goal:           'Answer at least 14 out of 20 questions correctly to capture the flag.',
  ar_goal:        'أجب على 14 سؤال من أصل 20 بشكل صحيح للحصول على العلم.',

  difficulty:   'INTERMEDIATE',
  category:     'WEB_SECURITY',
  skills:       ['Red Teaming', 'Adversary Simulation', 'Offensive Security'],

  xpReward:     150,
  pointsReward: 100,
  duration:     15,
  isPublished:  true,
};
