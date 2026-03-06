// src/modules/practice-labs/business-logic/labs/lab2/lab2.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const blvulnLab2Metadata: LabMetadata = {
  slug: 'blvuln-coupon-abuse-stacking',
  title: 'Business Logic: Coupon Abuse & Unlimited Discount Stacking',
  ar_title: 'المنطق التجاري: إساءة استخدام القسائم وتكديس الخصومات',
  description:
    'Exploit business logic flaws that allow reusing a single-use coupon multiple times and stacking discount codes to reduce a subscription price to $0.',
  ar_description:
    'استغل ثغرات في منطق الأعمال تسمح بإعادة استخدام قسيمة أحادية الاستخدام مرات متعددة وتكديس رموز الخصم لتخفيض سعر الاشتراك إلى صفر دولار.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'Business Logic',
    'Coupon Abuse',
    'Discount Stacking',
    'State Manipulation',
  ],
  xpReward: 230,
  pointsReward: 115,
  duration: 40,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Subscribe to the "Elite Plan" ($200/month) for free by abusing the coupon system — reuse SAVE20 multiple times and stack it with other coupons until the total reaches $0.',
  ar_goal:
    'اشترك في "Elite Plan" ($200/شهرياً) مجاناً بإساءة استخدام نظام الكوبونات — أعد استخدام SAVE20 عدة مرات وكدّسه مع كوبونات أخرى حتى يصل الإجمالي إلى $0.',

  briefing: {
    en: `StreamVault offers premium cybersecurity content subscriptions.
The Elite Plan costs $200/month. You're offered two promo codes:
SAVE20 — 20% off, single use per account.
WELCOME10 — 10% off, for new users.
You use SAVE20. Price drops to $160. Great.
You try to use it again. "Coupon already used." Expected.
But you notice the system applies the coupon, recalculates the price, 
then marks it as used — in that order.
What if you apply it again... before the "mark as used" step completes?
And what about stacking? Can you apply both codes on the same order?`,
    ar: `StreamVault تقدم اشتراكات محتوى أمن سيبراني متميزة.
Elite Plan تكلف $200/شهرياً. يُعرض عليك كودَا خصم:
SAVE20 — خصم 20%، استخدام واحد لكل حساب.
WELCOME10 — خصم 10%، للمستخدمين الجدد.
تستخدم SAVE20. ينخفض السعر إلى $160. رائع.
تحاول استخدامه مجدداً. "تم استخدام الكوبون مسبقاً." متوقع.
لكنك تلاحظ أن النظام يطبّق الكوبون، يعيد حساب السعر،
ثم يُعلّمه كمستخدَم — بهذا الترتيب.
ماذا لو طبّقته مجدداً... قبل اكتمال خطوة "التعليم كمستخدَم"؟
وماذا عن التكديس؟ هل يمكنك تطبيق كلا الكودَين على نفس الطلب؟`,
  },

  stepsOverview: {
    en: [
      'Create an order for the Elite Plan and apply SAVE20 once — observe the price change',
      'Test if both coupons can be applied to the same order (stacking)',
      'Probe the timing gap: apply SAVE20, then immediately apply it again before the DB marks it used',
      'Combine both techniques to drive the price to $0',
    ],
    ar: [
      'أنشئ طلباً لـ Elite Plan وطبّق SAVE20 مرة واحدة — لاحظ تغيير السعر',
      'اختبر هل يمكن تطبيق كلا الكوبونَين على نفس الطلب (التكديس)',
      'استكشف فجوة التوقيت: طبّق SAVE20، ثم طبّقه مجدداً فوراً قبل أن تُعلّمه قاعدة البيانات كمستخدَم',
      'ادمج كلا التقنيتَين لخفض السعر إلى $0',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'StreamVault coupon system has two flaws: (1) it checks coupon usage THEN marks as used AFTER price calculation — creating a race window for TOCTOU exploitation, and (2) it allows applying multiple different coupon codes to the same order with no stacking limit.',
    vulnerableCode:
      '// Coupon validation (vulnerable):\n' +
      'const coupon = await db.coupons.findOne({ code });\n' +
      'if (coupon.usedBy.includes(userId)) {\n' +
      "  return res.status(400).json({ error: 'Coupon already used' });\n" +
      '}\n' +
      '// ❌ Gap: marks as used AFTER price calculation, not before\n' +
      'const discount = applyDiscount(price, coupon.percentage);\n' +
      '// ... later ...\n' +
      'await db.coupons.update({ usedBy: [...coupon.usedBy, userId] });',
    exploitation:
      '1. POST /apply-coupon { orderId, coupon: "SAVE20" } → price $200 → $160.\n' +
      '2. Immediately POST /apply-coupon { orderId, coupon: "SAVE20" } again (race) → both pass the used-check → price $160 → $128.\n' +
      '3. POST /apply-coupon { orderId, coupon: "WELCOME10" } → stacking allowed → price drops further.\n' +
      '4. Repeat SAVE20 race + stack until total = $0 → POST /checkout.',
    steps: {
      en: [
        'POST /orders/create → get orderId for the Elite Plan at $200',
        'POST /apply-coupon { "orderId": "<id>", "coupon": "SAVE20" } → price drops to $160',
        'POST /apply-coupon { "orderId": "<id>", "coupon": "WELCOME10" } → stacking accepted → price drops to $144',
        'Send SAVE20 again rapidly (race): POST /apply-coupon twice in parallel with SAVE20 → second request passes before DB marks it used → price drops again',
        'Repeat SAVE20 race applications 3-4 more times → price reaches $0 → POST /checkout → flag in receipt',
      ],
      ar: [
        'POST /orders/create → احصل على orderId للـ Elite Plan بـ $200',
        'POST /apply-coupon { "orderId": "<id>", "coupon": "SAVE20" } → ينخفض السعر إلى $160',
        'POST /apply-coupon { "orderId": "<id>", "coupon": "WELCOME10" } → التكديس مقبول → ينخفض السعر إلى $144',
        'أرسل SAVE20 مجدداً بسرعة (race): أرسل POST /apply-coupon مرتين بالتوازي مع SAVE20 → ينجح الطلب الثاني قبل أن تُعلّمه قاعدة البيانات كمستخدَم → ينخفض السعر مجدداً',
        'كرر تطبيقات SAVE20 بالـ race 3-4 مرات إضافية → يصل السعر إلى $0 → POST /checkout → العلم في الإيصال',
      ],
    },
    fix: [
      'Mark coupon as used BEFORE calculating the discount, not after — use atomic DB transactions',
      'Use database-level locking: UPDATE coupons SET usedBy = userId WHERE code = ? AND userId NOT IN usedBy',
      'Enforce a maximum of 1 coupon per order at the application layer',
      'Add minimum price floor: if (total < 0) total = 0, and never process free orders without manual review',
    ],
  },

  postSolve: {
    explanation: {
      en: 'This lab combines two business logic flaws: TOCTOU (Time-Of-Check-Time-Of-Use) in coupon validation and unlimited discount stacking. TOCTOU means the system checks a condition (coupon unused) and acts on it, but the state can change between check and action — allowing concurrent requests to both pass the same check. Stacking allows multiple discounts to compound, driving the price to zero.',
      ar: 'يجمع هذا اللاب بين ثغرتَين في منطق الأعمال: TOCTOU (وقت الفحص - وقت الاستخدام) في التحقق من الكوبون والتكديس غير المحدود للخصومات. يعني TOCTOU أن النظام يتحقق من شرط (الكوبون غير مستخدَم) ويتصرف بناءً عليه، لكن الحالة يمكن أن تتغير بين الفحص والإجراء — مما يسمح للطلبات المتزامنة بتجاوز نفس الفحص. يسمح التكديس لخصومات متعددة بالتراكم، مما يخفض السعر إلى الصفر.',
    },
    impact: {
      en: 'Zero-cost subscriptions and products. In real platforms, coupon abuse has resulted in millions of dollars in fraudulent discounts. The combination of TOCTOU and stacking makes this particularly dangerous as it can be automated at scale.',
      ar: 'اشتراكات ومنتجات بتكلفة صفر. في المنصات الحقيقية، أسفر إساءة استخدام الكوبونات عن ملايين الدولارات من الخصومات الاحتيالية. يجعل الجمع بين TOCTOU والتكديس هذا خطيراً بشكل خاص لأنه يمكن أتمتته على نطاق واسع.',
    },
    fix: [
      'Atomic coupon redemption: mark used and calculate discount in a single DB transaction',
      'One coupon per order — enforce at schema level (unique constraint on orderId in coupons_used table)',
      'Rate limiting on coupon endpoints to prevent rapid sequential abuse',
      'Monitor discount depth: flag orders where total discount > 30% for manual review',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'Apply SAVE20 once — price drops from $200 to $160. Now try applying SAVE20 again immediately in a new request. Is there a small time window before the DB marks it as used?',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'Try applying both SAVE20 and WELCOME10 to the same order. The system might allow stacking multiple coupons without any limit.',
    },
    {
      order: 3,
      xpCost: 50,
      content:
        'Send POST /apply-coupon with SAVE20 multiple times in rapid succession using parallel requests (Promise.all / Burp Turbo Intruder). Each successful race drops the price by another 20%.',
    },
  ],

  flagAnswer: 'FLAG{BL_COUPON_STACKING_UNLIMITED_DISCOUNT_ABUSE}',
  initialState: {
    contents: [
      {
        title: 'ELITE-PLAN-200',
        body: JSON.stringify({
          name: 'StreamVault Elite Plan',
          price: 200,
          period: 'monthly',
        }),
        author: 'store',
        isPublic: true,
      },
    ],
  },
};
