// src/modules/practice-labs/mcq/labs/career-social-media/career-social-media.metadata.ts
import type { MCQLabMetadata } from '../../../types/mcq-lab-metadata.type';

export const careerSocialMediaMCQMetadata: MCQLabMetadata = {
  slug:          'mcq-career-social-media',
  jsonFile:      'career_in_Cyber/SocialMedia.json',
  questionCount: 20,
  passingScore:  70,

  title:          'Social Media Security Quiz',
  ar_title:       'اختبار أمن وسائل التواصل الاجتماعي',
  description:    'Explore security risks, OSINT techniques, and threats related to social media platforms.',
  ar_description: 'استكشف مخاطر الأمن وتقنيات OSINT والتهديدات المتعلقة بمنصات التواصل الاجتماعي.',
  goal:           'Answer at least 14 out of 20 questions correctly to capture the flag.',
  ar_goal:        'أجب على 14 سؤال من أصل 20 بشكل صحيح للحصول على العلم.',

  difficulty:   'BEGINNER',
  category:     'WEB_SECURITY',
  skills:       ['OSINT', 'Social Engineering', 'Social Media Security'],

  xpReward:     100,
  pointsReward: 100,
  duration:     15,
  isPublished:  true,
};
