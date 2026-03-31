// src/modules/practice-labs/mcq/labs/dforn-incident-responder/dforn-incident-responder.metadata.ts
import type { MCQLabMetadata } from '../../../types/mcq-lab-metadata.type';

export const dfornIncidentResponderMCQMetadata: MCQLabMetadata = {
  slug:          'mcq-dforn-incident-responder',
  jsonFile:      'labs_assets/MCQ-data/digital_Forn/IncidentResponder.json',
  questionCount: 20,
  passingScore:  70,

  title:          'Incident Responder Quiz',
  ar_title:       'اختبار مستجيب الحوادث',
  description:    'Test your understanding of incident response phases, containment strategies, and forensic triage.',
  ar_description: 'اختبر فهمك لمراحل الاستجابة للحوادث واستراتيجيات الاحتواء والتحليل الجنائي السريع.',
  goal:           'Answer at least 14 out of 20 questions correctly to capture the flag.',
  ar_goal:        'أجب على 14 سؤال من أصل 20 بشكل صحيح للحصول على العلم.',

  difficulty:   'INTERMEDIATE',
  category:     'WEB_SECURITY',
  skills:       ['Incident Response', 'Forensic Triage', 'Containment'],

  xpReward:     150,
  pointsReward: 100,
  duration:     15,
  isPublished:  true,
};
