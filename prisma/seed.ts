// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { lab1Metadata } from '../src/modules/practice-labs/sql-injection/labs/lab1/lab1.metadata';
import { seedLearningPaths } from './seed-data/paths';
import { seedCourses } from './seed-data/course-data/seed-courses';

const prisma = new PrismaClient();
const ALL_LABS = [lab1Metadata];

// ── Subscription Plans ────────────────────────────────────────────────
async function seedSubscriptionPlans() {
  console.log('💳 Seeding subscription plans...');

  const plans = [
    // FREE
    {
      name: 'free',
      ar_name: 'مجاني',
      description: 'Get started with cybersecurity basics',
      ar_description: 'ابدأ مع أساسيات الأمن السيبراني',
      price: 0,
      duration: 'MONTHLY' as const,
      stripePriceId: null, // ← مش محتاج stripe للـ free
      features: [
        '5 Labs',
        '2 Learning Paths',
        '3 Courses',
        'Community Support',
      ],
      ar_features: ['5 مختبرات', 'مسارين تعليميين', '3 كورسات', 'دعم المجتمع'],
      isActive: true,
    },
    // PRO MONTHLY
    {
      name: 'pro',
      ar_name: 'برو',
      description: 'Full access to all labs and courses',
      ar_description: 'وصول كامل لجميع المختبرات والكورسات',
      price: 14,
      duration: 'MONTHLY' as const,
      stripePriceId: null, // ← هتحطت بعد ما تعمل Stripe product
      features: [
        'Unlimited Labs',
        'Unlimited Courses',
        'Certificates',
        'VPN Access',
        'Email Support',
      ],
      ar_features: [
        'مختبرات غير محدودة',
        'كورسات غير محدودة',
        'شهادات',
        'اتصال VPN',
        'دعم بريد إلكتروني',
      ],
      isActive: true,
    },
    // PRO YEARLY
    {
      name: 'pro',
      ar_name: 'برو',
      description: 'Full access to all labs and courses (billed yearly)',
      ar_description: 'وصول كامل لجميع المختبرات والكورسات (سنوي)',
      price: 9,
      duration: 'YEARLY' as const,
      stripePriceId: null, // ← هتحطها بعد Stripe
      features: [
        'Unlimited Labs',
        'Unlimited Courses',
        'Certificates',
        'VPN Access',
        'Email Support',
      ],
      ar_features: [
        'مختبرات غير محدودة',
        'كورسات غير محدودة',
        'شهادات',
        'اتصال VPN',
        'دعم بريد إلكتروني',
      ],
      isActive: true,
    },
    // TEAM MONTHLY
    {
      name: 'team',
      ar_name: 'فريق',
      description: 'For teams and organizations',
      ar_description: 'للفرق والمؤسسات',
      price: 49,
      duration: 'MONTHLY' as const,
      stripePriceId: null,
      features: [
        'Everything in Pro',
        'Team Dashboard',
        'Admin Controls',
        '10 Members',
        'Priority Support',
      ],
      ar_features: [
        'كل مميزات برو',
        'لوحة تحكم الفريق',
        'صلاحيات الإدارة',
        '10 أعضاء',
        'دعم أولوي',
      ],
      isActive: false, // comingSoon
    },
    // TEAM YEARLY
    {
      name: 'team',
      ar_name: 'فريق',
      description: 'For teams and organizations (billed yearly)',
      ar_description: 'للفرق والمؤسسات (سنوي)',
      price: 35,
      duration: 'YEARLY' as const,
      stripePriceId: null,
      features: [
        'Everything in Pro',
        'Team Dashboard',
        'Admin Controls',
        '10 Members',
        'Priority Support',
      ],
      ar_features: [
        'كل مميزات برو',
        'لوحة تحكم الفريق',
        'صلاحيات الإدارة',
        '10 أعضاء',
        'دعم أولوي',
      ],
      isActive: false,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name }, // ← name هو @unique في الـ schema
      update: {
        price: plan.price,
        duration: plan.duration,
        features: plan.features,
        ar_features: plan.ar_features,
        isActive: plan.isActive,
        // لا تـ overwrite الـ stripePriceId لو موجود فعلاً
      },
      create: plan,
    });
    console.log(`  ✅ ${plan.name} (${plan.duration}) — $${plan.price}/mo`);
  }
}
// ─────────────────────────────────────────────────────────────────────

async function seedLabsMetaData() {
  console.log('🌱 Seeding labs from metadata files...');
  for (const meta of ALL_LABS) {
    const lab = await prisma.lab.upsert({
      where: { slug: meta.slug },
      update: {
        title: meta.title,
        ar_title: meta.ar_title,
        description: meta.description,
        ar_description: meta.ar_description,
        difficulty: meta.difficulty as any,
        category: meta.category as any,
        skills: meta.skills,
        xpReward: meta.xpReward,
        pointsReward: meta.pointsReward,
        duration: meta.duration,
        executionMode: meta.executionMode as any,
        isPublished: meta.isPublished,
        scenario: meta.scenario?.context,
        flagAnswer: meta.flagAnswer,
        initialState: meta.initialState,
        imageUrl: meta.imageUrl,
      },
      create: {
        slug: meta.slug,
        title: meta.title,
        ar_title: meta.ar_title,
        description: meta.description,
        ar_description: meta.ar_description,
        difficulty: meta.difficulty as any,
        category: meta.category as any,
        skills: meta.skills,
        xpReward: meta.xpReward,
        pointsReward: meta.pointsReward,
        duration: meta.duration,
        executionMode: meta.executionMode as any,
        isPublished: meta.isPublished,
        scenario: meta.scenario?.context,
        flagAnswer: meta.flagAnswer,
        initialState: meta.initialState,
        imageUrl: meta.imageUrl,
      },
    });
    for (const hint of meta.hints) {
      await prisma.labHint.upsert({
        where: { labId_order: { labId: lab.id, order: hint.order } },
        update: { content: hint.content, xpCost: hint.xpCost },
        create: {
          labId: lab.id,
          order: hint.order,
          content: hint.content,
          xpCost: hint.xpCost,
        },
      });
    }
    console.log(`  ✅ ${meta.slug} seeded`);
  }
}

async function main() {
  try {
    await seedSubscriptionPlans(); // ← أضيف هنا
    await seedLabsMetaData();
    await seedLearningPaths(prisma);
    await seedCourses(prisma);
    console.log('🎉 Done!');
  } catch (error) {
    console.error('Error during seeding:', error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
