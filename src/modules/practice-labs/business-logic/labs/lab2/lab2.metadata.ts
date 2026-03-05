// src/modules/practice-labs/bl-vuln/labs/lab2/lab2.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const blvulnLab2Metadata: LabMetadata = {
  slug: 'blvuln-coupon-abuse-stacking',
  title: 'Business Logic: Coupon Abuse & Unlimited Discount Stacking',
  ar_title: 'المنطق التجاري: إساءة استخدام القسائم وتكديس الخصومات',
  description:
    'Exploit business logic flaws that allow reusing a single-use coupon multiple times and stacking discount codes to reduce the subscription price to $0.',
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
  goal: 'Subscribe to the "Elite Plan" ($200/month) for free by abusing the coupon system — reuse SAVE20 multiple times and stack it with other coupons until the total reaches $0.',
  scenario: {
    context:
      'StreamVault is a cybersecurity content subscription platform. It offers discount coupons: SAVE20 (20% off, single-use) and WELCOME10 (10% off, new users). The coupon validation logic has two flaws: 1) it checks coupon usage before applying but marks used AFTER response, creating a race window, and 2) it allows applying multiple coupons on the same order.',
    vulnerableCode: `// Coupon validation (vulnerable):
const coupon = await db.coupons.findOne({ code });
if (coupon.usedBy.includes(userId)) {
  return res.status(400).json({ error: 'Coupon already used' });
}
// ❌ Gap: marks as used AFTER price calculation, not before
const discount = applyDiscount(price, coupon.percentage);
// ... later ...
await db.coupons.update({ usedBy: [...coupon.usedBy, userId] });`,
    exploitation:
      '1. Apply SAVE20 → price drops from $200 to $160. 2. Apply SAVE20 again in a new request before the DB updates → race condition allows reuse. 3. Stack WELCOME10 on top. 4. Repeat until price = $0.',
  },
  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'Apply SAVE20 coupon once. Notice the price drops. Now try applying it again immediately — is there a gap between validation and marking it used?',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'Try stacking two different coupons: first SAVE20, then WELCOME10 on the same order. The system might allow both.',
    },
    {
      order: 3,
      xpCost: 50,
      content:
        'Apply SAVE20 multiple times by sending rapid sequential requests. Each one reduces the price by 20%. After 5-6 applications, the price reaches $0.',
    },
    {
      order: 4,
      xpCost: 75,
      content:
        'POST /apply-coupon with { "orderId": "<id>", "coupon": "SAVE20" } — send this 5 times rapidly, then once with WELCOME10. Checkout when total = 0.',
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
