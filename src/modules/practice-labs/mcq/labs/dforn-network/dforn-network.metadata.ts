// src/modules/practice-labs/mcq/labs/dforn-network/dforn-network.metadata.ts
import type { MCQLabMetadata } from '../../../types/mcq-lab-metadata.type';

export const dfornNetworkMCQMetadata: MCQLabMetadata = {
  slug:          'mcq-dforn-network',
  jsonFile:      'digital_Forn/Network.json',
  questionCount: 20,
  passingScore:  70,

  title:          'Network Forensics Quiz',
  ar_title:       'اختبار جنائيات الشبكات',
  description:    'Test your knowledge of network forensics, packet analysis, and traffic investigation techniques.',
  ar_description: 'اختبر معرفتك بجنائيات الشبكات وتحليل الحزم وتقنيات التحقيق في حركة المرور.',
  goal:           'Answer at least 14 out of 20 questions correctly to capture the flag.',
  ar_goal:        'أجب على 14 سؤال من أصل 20 بشكل صحيح للحصول على العلم.',

  difficulty:   'INTERMEDIATE',
  category:     'WEB_SECURITY',
  skills:       ['Network Forensics', 'Packet Analysis', 'Wireshark', 'PCAP'],

  xpReward:     150,
  pointsReward: 100,
  duration:     15,
  isPublished:  true,
};
