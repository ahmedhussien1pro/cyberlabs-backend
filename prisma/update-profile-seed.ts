// prisma/update-profile-seed.ts
import {
  PrismaClient,
  SocialPlatform,
  SkillLevel,
  BadgeType,
  Role,
  SubscriptionStatus,
  BillingCycle,
  SubscriptionDuration,
} from '@prisma/client';

const prisma = new PrismaClient();

const TARGET_EMAIL = 'ahmedhussien13520@gmail.com';

async function main() {
  console.log(`🔍 Looking for user: ${TARGET_EMAIL}`);

  const user = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL },
  });

  if (!user) {
    console.error(`❌ User not found: ${TARGET_EMAIL}`);
    console.error(
      '   تأكد إن اليوزر موجود في الـ DB أو شغّل الـ register أول.',
    );
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.name} (id: ${user.id})`);

  // ── 1. Points ────────────────────────────────────────────
  await prisma.userPoints.upsert({
    where: { userId: user.id },
    update: { totalPoints: 4200, totalXP: 3750, level: 4 },
    create: { userId: user.id, totalPoints: 4200, totalXP: 3750, level: 4 },
  });
  console.log('✅ Points');

  // ── 2. Stats ─────────────────────────────────────────────
  await prisma.userStats.upsert({
    where: { userId: user.id },
    update: {
      totalHours: 87,
      activeDays: 43,
      currentStreak: 7,
      longestStreak: 14,
      lastActivityDate: new Date(),
    },
    create: {
      userId: user.id,
      totalHours: 87,
      activeDays: 43,
      currentStreak: 7,
      longestStreak: 14,
      lastActivityDate: new Date(),
    },
  });
  console.log('✅ Stats');

  // ── 3. Profile fields (bio, address) بدون مس الـ password ─
  await prisma.user.update({
    where: { id: user.id },
    data: {
      bio: user.bio ?? 'Cybersecurity enthusiast. CTF player. Bug hunter.',
      ar_bio:
        user.ar_bio ?? 'متحمس للأمن السيبراني. لاعب CTF. باحث عن الثغرات.',
      address: user.address ?? 'Cairo, Egypt',
      isVerified: true,
      isEmailVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Profile fields updated');

  // ── 4. Social Links ───────────────────────────────────────
  await prisma.socialLink.deleteMany({ where: { userId: user.id } });
  await prisma.socialLink.createMany({
    data: [
      {
        userId: user.id,
        type: SocialPlatform.GITHUB,
        url: 'https://github.com/ahmedhussien1pro',
      },
      {
        userId: user.id,
        type: SocialPlatform.LINKEDIN,
        url: 'https://linkedin.com/in/ahmedhussein',
      },
      {
        userId: user.id,
        type: SocialPlatform.TWITTER,
        url: 'https://twitter.com/ahmedhussien',
      },
    ],
  });
  console.log('✅ Social links');

  // ── 5. Skills ────────────────────────────────────────────
  const skills = [
    { name: 'Web Exploitation', progress: 72 },
    { name: 'Reverse Engineering', progress: 45 },
    { name: 'Cryptography', progress: 58 },
    { name: 'OSINT', progress: 83 },
  ];
  for (const s of skills) {
    const skill = await prisma.skill.upsert({
      where: { name: s.name },
      update: {},
      create: { name: s.name, ar_name: s.name, category: 'CYBERSECURITY' },
    });
    await prisma.userSkill.upsert({
      where: { userId_skillId: { userId: user.id, skillId: skill.id } },
      update: { progress: s.progress },
      create: {
        userId: user.id,
        skillId: skill.id,
        level: SkillLevel.INTERMEDIATE,
        progress: s.progress,
      },
    });
  }
  console.log('✅ Skills');

  // ── 6. Badges ────────────────────────────────────────────
  const badgesData = [
    {
      code: 'FIRST_BLOOD',
      title: 'First Blood',
      type: BadgeType.LAB_SOLVED,
      xpReward: 100,
    },
    {
      code: 'STREAK_7',
      title: '7-Day Streak',
      type: BadgeType.STREAK,
      xpReward: 200,
    },
    {
      code: 'CTF_WINNER',
      title: 'CTF Winner',
      type: BadgeType.COMMUNITY,
      xpReward: 500,
    },
  ];
  for (const b of badgesData) {
    const badge = await prisma.badge.upsert({
      where: { code: b.code },
      update: {},
      create: {
        code: b.code,
        title: b.title,
        type: b.type,
        xpReward: b.xpReward,
      },
    });
    await prisma.userBadge.upsert({
      where: {
        userId_badgeId_context: {
          userId: user.id,
          badgeId: badge.id,
          context: 'seed',
        },
      },
      update: {},
      create: {
        userId: user.id,
        badgeId: badge.id,
        context: 'seed',
        awardedAt: new Date(),
      },
    });
  }
  console.log('✅ Badges');

  // ── 7. Activity Heatmap (آخر 90 يوم) ────────────────────
  const since90 = new Date();
  since90.setDate(since90.getDate() - 90);
  await prisma.userActivity.deleteMany({
    where: { userId: user.id, date: { gte: since90 } },
  });

  const today = new Date();
  const activityRows = Array.from({ length: 90 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const active = Math.random() > 0.35;
    return {
      userId: user.id,
      date: d,
      activeMinutes: active ? Math.floor(Math.random() * 90) + 10 : 0,
      completedTasks: active ? Math.floor(Math.random() * 5) : 0,
      labsSolved: active ? Math.floor(Math.random() * 3) : 0,
    };
  });
  await prisma.userActivity.createMany({ data: activityRows });
  console.log('✅ Activity heatmap (90 days)');

  // ── 8. Education ─────────────────────────────────────────
  const existingEdu = await prisma.education.findFirst({
    where: { userId: user.id },
  });
  if (!existingEdu) {
    await prisma.education.create({
      data: {
        userId: user.id,
        institution: 'Cairo University',
        degree: "Bachelor's",
        field: 'Computer Science',
        startYear: 2020,
        endYear: 2024,
        isCurrent: false,
      },
    });
    console.log('✅ Education');
  } else {
    console.log('⏭️  Education already exists — skipped');
  }

  // ── 9. Certifications ────────────────────────────────────
  const existingCerts = await prisma.certification.findFirst({
    where: { userId: user.id },
  });
  if (!existingCerts) {
    await prisma.certification.createMany({
      data: [
        {
          userId: user.id,
          title: 'Certified Ethical Hacker (CEH)',
          issuer: 'EC-Council',
          issueDate: new Date('2024-06-01'),
          expireDate: new Date('2027-06-01'),
          credentialId: 'CEH-123456',
          credentialUrl: 'https://aspen.eccouncil.org/verify',
        },
        {
          userId: user.id,
          title: 'CompTIA Security+',
          issuer: 'CompTIA',
          issueDate: new Date('2023-11-15'),
        },
      ],
    });
    console.log('✅ Certifications');
  } else {
    console.log('⏭️  Certifications already exist — skipped');
  }

  // ── 10. Career Path ──────────────────────────────────────
  const path = await prisma.careerPath.upsert({
    where: { name: 'Penetration Tester' },
    update: {},
    create: {
      name: 'Penetration Tester',
      ar_name: 'مختبر اختراق',
      description: 'Master offensive security techniques',
    },
  });
  await prisma.userCareerPath.upsert({
    where: { userId_careerPathId: { userId: user.id, careerPathId: path.id } },
    update: { progress: 65 },
    create: {
      userId: user.id,
      careerPathId: path.id,
      progress: 65,
      startedAt: new Date('2024-01-01'),
    },
  });
  console.log('✅ Career path');

  const proPlan = await prisma.subscriptionPlan.upsert({
    where: {
      name_duration: { name: 'pro', duration: SubscriptionDuration.MONTHLY },
    },
    update: { isActive: true },
    create: {
      name: 'pro',
      ar_name: 'برو',
      description: 'Pro plan — full access',
      ar_description: 'الخطة الاحترافية — وصول كامل',
      price: 19,
      duration: SubscriptionDuration.MONTHLY,
      features: ['Full lab access', 'Priority support', 'Certificates'],
      ar_features: ['وصول كامل للمعامل', 'دعم أولوية', 'شهادات'],
      isActive: true,
    },
  });
  console.log(`✅ SubscriptionPlan: pro/MONTHLY (id: ${proPlan.id})`);

  await prisma.subscription.deleteMany({
    where: {
      userId: user.id,
      stripeSubscriptionId: null,
    },
  });

  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  await prisma.subscription.create({
    data: {
      userId: user.id,
      planId: proPlan.id,
      status: SubscriptionStatus.ACTIVE,
      billingCycle: BillingCycle.MONTHLY,
      currentPeriodEnd: oneYearFromNow,
      cancelAtPeriodEnd: false,
      isActive: true,
      startDate: new Date(),
    },
  });
  console.log('✅ Pro subscription created (expires in 1 year)');

  console.log('\n🎉 Seed complete!');
  console.log('──────────────────────────────────');
  console.log(`📧  Email:    ${TARGET_EMAIL}`);
  console.log(`🔑  Password: Moody123  (unchanged)`);
  console.log(`🆔  User ID:  ${user.id}`);
  console.log(`💎  Plan:     Pro (MONTHLY) — active for 1 year`);
  console.log('──────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
