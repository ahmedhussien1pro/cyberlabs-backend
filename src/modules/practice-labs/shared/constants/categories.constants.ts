// src/modules/practice-labs/shared/constants/categories.constants.ts

export const CATEGORY_NAMES_EN: Record<string, string> = {
  WEB_SECURITY: 'Web Security',
  PENETRATION_TESTING: 'Penetration Testing',
  MALWARE_ANALYSIS: 'Malware Analysis',
  CLOUD_SECURITY: 'Cloud Security',
  FUNDAMENTALS: 'Fundamentals',
  CRYPTOGRAPHY: 'Cryptography',
  NETWORK_SECURITY: 'Network Security',
  TOOLS_AND_TECHNIQUES: 'Tools & Techniques',
  CAREER_AND_INDUSTRY: 'Career & Industry',
};

export const CATEGORY_NAMES_AR: Record<string, string> = {
  WEB_SECURITY: 'أمن الويب',
  PENETRATION_TESTING: 'اختبار الاختراق',
  MALWARE_ANALYSIS: 'تحليل البرمجيات الخبيثة',
  CLOUD_SECURITY: 'أمن السحابة',
  FUNDAMENTALS: 'الأساسيات',
  CRYPTOGRAPHY: 'التشفير',
  NETWORK_SECURITY: 'أمن الشبكات',
  TOOLS_AND_TECHNIQUES: 'الأدوات والتقنيات',
  CAREER_AND_INDUSTRY: 'المسار المهني',
};

export function getCategoryNameEn(category: string): string {
  return CATEGORY_NAMES_EN[category] ?? category;
}

export function getCategoryNameAr(category: string): string {
  return CATEGORY_NAMES_AR[category] ?? category;
}
