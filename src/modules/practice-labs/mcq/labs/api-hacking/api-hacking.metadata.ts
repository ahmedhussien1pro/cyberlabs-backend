// src/modules/practice-labs/mcq/labs/api-hacking/api-hacking.metadata.ts
import type { MCQLabMetadata } from '../../../types/mcq-lab-metadata.type';

export const apiHackingMCQMetadata: MCQLabMetadata = {
  slug:          'mcq-api-hacking',
  jsonFile:      'API_Hacking.json',
  questionCount: 20,
  passingScore:  70,

  title:          'API Hacking Quiz',
  ar_title:       'اختبار اختراق الـ API',
  description:
    'Test your knowledge of REST APIs, HTTP methods, authentication, and common API vulnerabilities.',
  ar_description:
    'اختبر معرفتك بـ REST APIs وأساليب HTTP والمصادقة والثغرات الشائعة في الـ API.',
  goal:    'Answer at least 14 out of 20 questions correctly to capture the flag.',
  ar_goal: 'أجب على 14 سؤال من أصل 20 بشكل صحيح للحصول على العلم.',

  difficulty: 'BEGINNER',
  category:   'WEB_SECURITY',
  skills:     ['REST API', 'HTTP Methods', 'API Authentication', 'API Security', 'Rate Limiting', 'GraphQL'],

  xpReward:     100,
  pointsReward: 100,
  duration:     15,
  isPublished:  true,
};
