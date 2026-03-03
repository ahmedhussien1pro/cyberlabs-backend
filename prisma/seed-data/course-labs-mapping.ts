export const courseLabsMapping: Array<{
  courseSlug: string;
  labSlugs: string[];
}> = [
  {
    courseSlug: 'sql-injection',
    labSlugs: ['sqli-basic', 'sqli-union-based', 'sqli-blind'],
  },
  {
    courseSlug: 'owasp-xss-csrf',
    labSlugs: ['xss-reflected', 'xss-stored', 'csrf-basic'],
  },
  {
    courseSlug: 'web-fundamentals',
    labSlugs: ['http-basics', 'burp-intro'],
  },
  // أضف باقي الكورسات حسب ما عندك من labs في DB
];
