// src/modules/practice-labs/mcq/labs/dforn-blockchain/dforn-blockchain.metadata.ts
import type { MCQLabMetadata } from '../../../types/mcq-lab-metadata.type';

export const dfornBlockchainMCQMetadata: MCQLabMetadata = {
  slug:          'mcq-dforn-blockchain',
  jsonFile:      'labs_assets/MCQ-data/digital_Forn/BlockchainAndCryptocurrency.json',
  questionCount: 20,
  passingScore:  70,

  title:          'Blockchain & Cryptocurrency Forensics Quiz',
  ar_title:       'اختبار جنائيات البلوك تشين والعملات الرقمية',
  description:    'Test your knowledge of blockchain forensics, cryptocurrency tracing, and on-chain investigation.',
  ar_description: 'اختبر معرفتك بجنائيات البلوك تشين وتتبع العملات الرقمية والتحقيقات على السلسلة.',
  goal:           'Answer at least 14 out of 20 questions correctly to capture the flag.',
  ar_goal:        'أجب على 14 سؤال من أصل 20 بشكل صحيح للحصول على العلم.',

  difficulty:   'INTERMEDIATE',
  category:     'WEB_SECURITY',
  skills:       ['Blockchain Forensics', 'Cryptocurrency', 'On-chain Investigation'],

  xpReward:     150,
  pointsReward: 100,
  duration:     15,
  isPublished:  true,
};
