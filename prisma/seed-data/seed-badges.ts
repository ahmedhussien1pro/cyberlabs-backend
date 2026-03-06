// prisma/seed-data/seed-badges.ts
import { PrismaClient, BadgeType } from '@prisma/client';

const BADGES = [
  // ── Lab Solved Milestones ───────────────────────────────────────────
  {
    code: 'first_lab',
    title: 'First Blood',
    ar_title: 'أول الدم',
    description: 'Complete your very first lab',
    ar_description: 'أتممت أول مختبر لك',
    type: BadgeType.LAB_SOLVED,
    xpReward: 100,
    pointsReward: 50,
    iconUrl: null,
  },
  {
    code: 'lab_novice',
    title: 'Lab Novice',
    ar_title: 'مبتدئ المختبرات',
    description: 'Complete 5 labs',
    ar_description: 'أتممت 5 مختبرات',
    type: BadgeType.LAB_SOLVED,
    xpReward: 200,
    pointsReward: 100,
    iconUrl: null,
  },
  {
    code: 'lab_apprentice',
    title: 'Apprentice Hacker',
    ar_title: 'متدرب اختراق',
    description: 'Complete 10 labs',
    ar_description: 'أتممت 10 مختبرات',
    type: BadgeType.LAB_SOLVED,
    xpReward: 400,
    pointsReward: 200,
    iconUrl: null,
  },
  {
    code: 'lab_expert',
    title: 'Lab Expert',
    ar_title: 'خبير المختبرات',
    description: 'Complete 25 labs',
    ar_description: 'أتممت 25 مختبراً',
    type: BadgeType.LAB_SOLVED,
    xpReward: 800,
    pointsReward: 400,
    iconUrl: null,
  },
  {
    code: 'lab_master',
    title: 'Lab Master',
    ar_title: 'متقن المختبرات',
    description: 'Complete 50 labs — you are elite!',
    ar_description: 'أتممت 50 مختبراً — أنت من النخبة!',
    type: BadgeType.LAB_SOLVED,
    xpReward: 1500,
    pointsReward: 750,
    iconUrl: null,
  },

  // ── Course Completion Milestones ────────────────────────────────────
  {
    code: 'first_course',
    title: 'First Course',
    ar_title: 'أول كورس',
    description: 'Complete your first course',
    ar_description: 'أتممت أول كورس لك',
    type: BadgeType.COURSE_COMPLETION,
    xpReward: 150,
    pointsReward: 75,
    iconUrl: null,
  },
  {
    code: 'course_explorer',
    title: 'Course Explorer',
    ar_title: 'مستكشف المسارات',
    description: 'Complete 3 courses',
    ar_description: 'أتممت 3 كورسات',
    type: BadgeType.COURSE_COMPLETION,
    xpReward: 300,
    pointsReward: 150,
    iconUrl: null,
  },
  {
    code: 'course_master',
    title: 'Course Master',
    ar_title: 'متقن الكورسات',
    description: 'Complete 10 courses',
    ar_description: 'أتممت 10 كورسات',
    type: BadgeType.COURSE_COMPLETION,
    xpReward: 1000,
    pointsReward: 500,
    iconUrl: null,
  },

  // ── Streak Badges ───────────────────────────────────────────────────
  {
    code: 'streak_7',
    title: 'Week Warrior',
    ar_title: 'محارب الأسبوع',
    description: 'Maintain a 7-day learning streak',
    ar_description: 'حافظت على 7 أيام متتالية',
    type: BadgeType.STREAK,
    xpReward: 250,
    pointsReward: 125,
    iconUrl: null,
  },
  {
    code: 'streak_30',
    title: 'Monthly Grinder',
    ar_title: 'مثابر الشهر',
    description: 'Maintain a 30-day learning streak',
    ar_description: 'حافظت على 30 يوماً متتالية',
    type: BadgeType.STREAK,
    xpReward: 1000,
    pointsReward: 500,
    iconUrl: null,
  },

  // ── Community Badges ────────────────────────────────────────────────
  {
    code: 'community_first_post',
    title: 'Community Member',
    ar_title: 'عضو المجتمع',
    description: 'Post your first discussion',
    ar_description: 'أضفت أول نقاش لك',
    type: BadgeType.COMMUNITY,
    xpReward: 50,
    pointsReward: 25,
    iconUrl: null,
  },
];

export async function seedBadges(prisma: PrismaClient) {
  console.log('\n🏅 Seeding badges...');

  let created = 0;
  let skipped = 0;

  for (const badge of BADGES) {
    const existing = await prisma.badge.findUnique({
      where: { code: badge.code },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.badge.create({ data: badge });
    console.log(`  ✅ ${badge.code} — ${badge.title}`);
    created++;
  }

  console.log(
    `  📊 Badges: ${created} created, ${skipped} already existed`,
  );
}
