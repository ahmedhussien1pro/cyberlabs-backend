// src/modules/practice-labs/mcq/labs/regex/regex.metadata.ts
import type { MCQLabMetadata } from '../../../types/mcq-lab-metadata.type';

export const regexMCQMetadata: MCQLabMetadata = {
  slug:          'mcq-regex',
  jsonFile:      'Regex.json',
  questionCount: 20,
  passingScore:  70,

  title:          'Regex Quiz',
  ar_title:       'اختبار التعبيرات النمطية',
  description:    'Test your knowledge of regular expressions and pattern matching.',
  ar_description: 'اختبر معرفتك بالتعبيرات النمطية ومطابقة الأنماط.',
  goal:           'Answer at least 14 out of 20 questions correctly to capture the flag.',
  ar_goal:        'أجب على 14 سؤال من أصل 20 بشكل صحيح للحصول على العلم.',

  difficulty:   'BEGINNER',
  category:     'WEB_SECURITY',
  skills:       ['Regex', 'Pattern Matching', 'String Processing'],

  xpReward:     100,
  pointsReward: 100,
  duration:     15,
  isPublished:  true,
};
