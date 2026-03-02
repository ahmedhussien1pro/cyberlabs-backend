// prisma/seed-data/subscription-plans.ts
import { PrismaClient, SubscriptionDuration } from '@prisma/client';

type PlanSeed = {
  name: 'free' | 'pro' | 'team' | 'enterprise';
  ar_name: string;
  description: string;
  ar_description: string;
  duration: SubscriptionDuration;
  price: number;
  stripePriceId: string;
  isActive: boolean;
  features: string[];
  ar_features: string[];
};

export const SUBSCRIPTION_PLANS: PlanSeed[] = [
  // ── FREE ────────────────────────────────────────────────────────────────────
  {
    name: 'free',
    ar_name: 'مجاني',
    description:
      'Start learning the fundamentals with limited labs and community access.',
    ar_description:
      'ابدأ بتعلّم الأساسيات مع عدد محدود من المختبرات وإمكانية الوصول للمجتمع.',
    duration: SubscriptionDuration.MONTHLY,
    price: 0,
    stripePriceId: 'prod_U4mqKmVw6Trc6H', // Free product ID (not a price ID)
    isActive: true,
    features: [
      'Access to selected beginner labs',
      '2 learning paths',
      '3 introductory courses',
      'Community support',
    ],
    ar_features: [
      'الوصول إلى بعض المختبرات للمبتدئين',
      'مساران تعليميان',
      '3 كورسات تمهيدية',
      'دعم المجتمع',
    ],
  },

  // ── PRO MONTHLY ─────────────────────────────────────────────────────────────
  {
    name: 'pro',
    ar_name: 'برو',
    description:
      'Full access to all labs and courses, certificates, and advanced learning paths.',
    ar_description:
      'وصول كامل لكل المختبرات والكورسات، مع شهادات ومسارات متقدمة.',
    duration: SubscriptionDuration.MONTHLY,
    price: 14,
    stripePriceId: 'price_1T6dDcPFsjrIMgRe8LkEdp0P',
    isActive: true,
    features: [
      'Unlimited labs (real-world scenarios)',
      'Unlimited courses & roadmaps',
      'Certificates of completion',
      'Priority lab resources',
      'Email support',
    ],
    ar_features: [
      'مختبرات غير محدودة (سيناريوهات واقعية)',
      'كورسات ومسارات تعلم غير محدودة',
      'شهادات إتمام',
      'أولوية في موارد المختبرات',
      'دعم عبر البريد الإلكتروني',
    ],
  },

  // ── PRO YEARLY ──────────────────────────────────────────────────────────────
  {
    name: 'pro',
    ar_name: 'برو',
    description:
      'Full access to all labs and courses — billed yearly (best value).',
    ar_description: 'وصول كامل لكل المختبرات والكورسات — دفع سنوي (أفضل قيمة).',
    duration: SubscriptionDuration.YEARLY,
    price: 9, // per-month display price; Stripe charges $108/year
    stripePriceId: 'price_1T6dFxPFsjrIMgReW0fD8iQp',
    isActive: true,
    features: [
      'Everything in Pro Monthly',
      'Best value annual billing',
      'Certificates of completion',
      'Priority lab resources',
      'Email support',
    ],
    ar_features: [
      'كل مميزات برو الشهري',
      'أفضل قيمة في الدفع السنوي',
      'شهادات إتمام',
      'أولوية في موارد المختبرات',
      'دعم عبر البريد الإلكتروني',
    ],
  },

  // ── TEAM MONTHLY (coming soon) ──────────────────────────────────────────────
  {
    name: 'team',
    ar_name: 'فريق',
    description:
      'Team seats, admin controls, and shared progress analytics (coming soon).',
    ar_description:
      'مقاعد للفريق، صلاحيات إدارة، وتحليلات تقدّم مشتركة (قريباً).',
    duration: SubscriptionDuration.MONTHLY,
    price: 49,
    stripePriceId: 'price_1T6dDxPFsjrIMgRe4fDqAn8r',
    isActive: false,
    features: [
      'Everything in Pro',
      'Team dashboard & analytics',
      'Seat management',
      'SSO (planned)',
      'Priority support',
    ],
    ar_features: [
      'كل مميزات برو',
      'لوحة تحكم وتحليلات للفريق',
      'إدارة المقاعد',
      'تسجيل دخول موحد SSO (مخطط)',
      'دعم أولوية',
    ],
  },

  // ── TEAM YEARLY (coming soon) ───────────────────────────────────────────────
  {
    name: 'team',
    ar_name: 'فريق',
    description: 'Team plan — billed yearly (coming soon).',
    ar_description: 'خطة الفريق — دفع سنوي (قريباً).',
    duration: SubscriptionDuration.YEARLY,
    price: 35, // per-month display; Stripe charges $420/year
    stripePriceId: 'price_1T6dFVPFsjrIMgResRp5X3uE',
    isActive: false,
    features: [
      'Everything in Team Monthly',
      'Annual billing discount',
      'Team dashboard & analytics',
      'Seat management',
      'Priority support',
    ],
    ar_features: [
      'كل مميزات خطة الفريق الشهرية',
      'خصم الدفع السنوي',
      'لوحة تحكم وتحليلات للفريق',
      'إدارة المقاعد',
      'دعم أولوية',
    ],
  },

  // ── ENTERPRISE MONTHLY (coming soon) ────────────────────────────────────────
  {
    name: 'enterprise',
    ar_name: 'مؤسسات',
    description:
      'Custom security training program with enterprise integrations (coming soon).',
    ar_description: 'برنامج تدريب مخصص مع تكاملات للمؤسسات (قريباً).',
    duration: SubscriptionDuration.MONTHLY,
    price: 199,
    stripePriceId: 'price_1T6dEKPFsjrIMgReTTNTyC5C',
    isActive: false,
    features: [
      'Everything in Team',
      'Custom learning paths',
      'Dedicated support channel',
      'Audit logs & reporting',
      'Custom invoicing (planned)',
    ],
    ar_features: [
      'كل مميزات خطة الفريق',
      'مسارات تعلم مخصصة',
      'قناة دعم مخصصة',
      'سجلات تدقيق وتقارير',
      'فواتير مخصصة (مخطط)',
    ],
  },

  // ── ENTERPRISE YEARLY (coming soon) ─────────────────────────────────────────
  {
    name: 'enterprise',
    ar_name: 'مؤسسات',
    description: 'Enterprise plan — billed yearly (coming soon).',
    ar_description: 'خطة المؤسسات — دفع سنوي (قريباً).',
    duration: SubscriptionDuration.YEARLY,
    price: 149, // per-month display; Stripe charges $1788/year
    stripePriceId: 'price_1T6dF0PFsjrIMgRehqjLK1F9',
    isActive: false,
    features: [
      'Everything in Enterprise Monthly',
      'Annual billing discount',
      'Custom learning paths',
      'Dedicated support channel',
      'Audit logs & reporting',
    ],
    ar_features: [
      'كل مميزات خطة المؤسسات الشهرية',
      'خصم الدفع السنوي',
      'مسارات تعلم مخصصة',
      'قناة دعم مخصصة',
      'سجلات تدقيق وتقارير',
    ],
  },
];

export async function seedSubscriptionPlans(prisma: PrismaClient) {
  console.log('💳 Seeding subscription plans...');

  for (const p of SUBSCRIPTION_PLANS) {
    await prisma.subscriptionPlan.upsert({
      where: {
        name_duration: { name: p.name, duration: p.duration },
      },
      update: {
        ar_name: p.ar_name,
        description: p.description,
        ar_description: p.ar_description,
        price: p.price,
        stripePriceId: p.stripePriceId,
        isActive: p.isActive,
        features: p.features,
        ar_features: p.ar_features,
      },
      create: p,
    });
    console.log(
      `  ✅ ${p.name.padEnd(10)} | ${p.duration.padEnd(7)} | $${String(p.price).padStart(3)}/mo | active=${p.isActive}`,
    );
  }

  console.log(`💳 Done — ${SUBSCRIPTION_PLANS.length} plans seeded.`);
}
