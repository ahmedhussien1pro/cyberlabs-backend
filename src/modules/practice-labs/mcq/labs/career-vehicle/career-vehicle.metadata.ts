// src/modules/practice-labs/mcq/labs/career-vehicle/career-vehicle.metadata.ts
import type { MCQLabMetadata } from '../../../types/mcq-lab-metadata.type';

export const careerVehicleMCQMetadata: MCQLabMetadata = {
  slug:          'mcq-career-vehicle-security',
  jsonFile:      'labs_assets/MCQ-data/career_in_Cyber/Vehicle.json',
  questionCount: 20,
  passingScore:  70,

  title:          'Vehicle Cybersecurity Quiz',
  ar_title:       'اختبار أمن السيارات السيبراني',
  description:    'Test your knowledge of automotive cybersecurity, CAN bus, and vehicle attack surfaces.',
  ar_description: 'اختبر معرفتك بأمن السيارات السيبراني وبروتوكول CAN bus وأسطح الهجوم على المركبات.',
  goal:           'Answer at least 14 out of 20 questions correctly to capture the flag.',
  ar_goal:        'أجب على 14 سؤال من أصل 20 بشكل صحيح للحصول على العلم.',

  difficulty:   'INTERMEDIATE',
  category:     'WEB_SECURITY',
  skills:       ['Vehicle Security', 'CAN Bus', 'Automotive Hacking'],

  xpReward:     150,
  pointsReward: 100,
  duration:     15,
  isPublished:  true,
};
