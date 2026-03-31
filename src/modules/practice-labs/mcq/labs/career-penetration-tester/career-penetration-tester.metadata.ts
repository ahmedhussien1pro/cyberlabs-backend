// src/modules/practice-labs/mcq/labs/career-penetration-tester/career-penetration-tester.metadata.ts
import type { MCQLabMetadata } from '../../../types/mcq-lab-metadata.type';

export const careerPentestMCQMetadata: MCQLabMetadata = {
  slug:          'mcq-career-penetration-tester',
  jsonFile:      'career_in_Cyber/PenetrationTester.json',
  questionCount: 20,
  passingScore:  70,

  title:          'Penetration Tester Career Quiz',
  ar_title:       'اختبار مسار مختبر الاختراق',
  description:    'Explore the skills, tools, and mindset required to become a professional penetration tester.',
  ar_description: 'استكشف المهارات والأدوات وطريقة التفكير المطلوبة لتصبح مختبر اختراق محترف.',
  goal:           'Answer at least 14 out of 20 questions correctly to capture the flag.',
  ar_goal:        'أجب على 14 سؤال من أصل 20 بشكل صحيح للحصول على العلم.',

  difficulty:   'BEGINNER',
  category:     'WEB_SECURITY',
  skills:       ['Penetration Testing', 'Ethical Hacking', 'Cybersecurity Careers'],

  xpReward:     100,
  pointsReward: 100,
  duration:     15,
  isPublished:  true,
};
