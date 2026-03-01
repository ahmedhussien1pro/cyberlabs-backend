import { NotificationPriority } from '@prisma/client';

export type NotificationPayload = {
  type: string;
  title: string;
  ar_title: string;
  body?: string;
  ar_body?: string;
  actionUrl?: string;
  priority: NotificationPriority;
};

export const NotificationEvents = {
  // ─── Auth ─────────────────────────────────────────────────────────
  login: (ip?: string): NotificationPayload => ({
    type: 'AUTH_LOGIN',
    title: 'New Login Detected',
    ar_title: 'تم تسجيل دخول جديد',
    body: ip ? `Login from IP: ${ip}` : 'You logged in successfully.',
    ar_body: ip ? `تسجيل دخول من: ${ip}` : 'تم تسجيل دخولك بنجاح.',
    actionUrl: '/settings/security',
    priority: NotificationPriority.MEDIUM,
  }),

  register: (name: string): NotificationPayload => ({
    type: 'AUTH_REGISTER',
    title: `Welcome to CyberLabs, ${name}!`,
    ar_title: `أهلاً بك في CyberLabs، ${name}!`,
    body: 'Your account has been created. Start your cybersecurity journey!',
    ar_body: 'تم إنشاء حسابك. ابدأ رحلتك في الأمن السيبراني!',
    actionUrl: '/dashboard',
    priority: NotificationPriority.HIGH,
  }),

  passwordChanged: (): NotificationPayload => ({
    type: 'AUTH_PASSWORD_CHANGED',
    title: 'Password Changed',
    ar_title: 'تم تغيير كلمة المرور',
    body: 'Your password was updated successfully. If this was not you, contact support.',
    ar_body: 'تم تحديث كلمة المرور بنجاح. إذا لم تكن أنت، تواصل مع الدعم.',
    actionUrl: '/settings/security',
    priority: NotificationPriority.HIGH,
  }),

  passwordResetRequested: (): NotificationPayload => ({
    type: 'AUTH_PASSWORD_RESET',
    title: 'Password Reset Requested',
    ar_title: 'طلب إعادة تعيين كلمة المرور',
    body: 'A password reset link has been sent to your email.',
    ar_body: 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني.',
    actionUrl: '/settings/security',
    priority: NotificationPriority.URGENT,
  }),

  twoFactorEnabled: (): NotificationPayload => ({
    type: 'AUTH_2FA_ENABLED',
    title: 'Two-Factor Authentication Enabled',
    ar_title: 'تم تفعيل التحقق بخطوتين',
    body: 'Your account is now more secure with 2FA.',
    ar_body: 'أصبح حسابك أكثر أمانًا مع التحقق بخطوتين.',
    actionUrl: '/settings/security',
    priority: NotificationPriority.MEDIUM,
  }),

  emailVerified: (): NotificationPayload => ({
    type: 'AUTH_EMAIL_VERIFIED',
    title: 'Email Verified',
    ar_title: 'تم التحقق من البريد الإلكتروني',
    body: 'Your email address has been verified successfully.',
    ar_body: 'تم التحقق من بريدك الإلكتروني بنجاح.',
    actionUrl: '/dashboard',
    priority: NotificationPriority.MEDIUM,
  }),

  // ─── Profile ──────────────────────────────────────────────────────
  profileUpdated: (): NotificationPayload => ({
    type: 'PROFILE_UPDATED',
    title: 'Profile Updated',
    ar_title: 'تم تحديث الملف الشخصي',
    body: 'Your profile information has been updated.',
    ar_body: 'تم تحديث معلومات ملفك الشخصي.',
    actionUrl: '/profile',
    priority: NotificationPriority.LOW,
  }),

  avatarChanged: (): NotificationPayload => ({
    type: 'PROFILE_AVATAR_CHANGED',
    title: 'Avatar Updated',
    ar_title: 'تم تحديث الصورة الشخصية',
    body: 'Your profile picture has been changed successfully.',
    ar_body: 'تم تغيير صورتك الشخصية بنجاح.',
    actionUrl: '/profile',
    priority: NotificationPriority.LOW,
  }),

  // ─── Courses ──────────────────────────────────────────────────────
  courseEnrolled: (
    courseTitle: string,
    courseSlug: string,
  ): NotificationPayload => ({
    type: 'COURSE_ENROLLED',
    title: `Enrolled in "${courseTitle}"`,
    ar_title: `تم التسجيل في "${courseTitle}"`,
    body: 'Good luck on your learning journey!',
    ar_body: 'حظًا موفقًا في رحلة تعلمك!',
    actionUrl: `/courses/${courseSlug}`,
    priority: NotificationPriority.MEDIUM,
  }),

  courseCompleted: (
    courseTitle: string,
    courseSlug: string,
  ): NotificationPayload => ({
    type: 'COURSE_COMPLETED',
    title: `🎉 Course Completed: "${courseTitle}"`,
    ar_title: `🎉 أتممت الكورس: "${courseTitle}"`,
    body: 'Congratulations! Your certificate is ready.',
    ar_body: 'مبروك! شهادتك جاهزة.',
    actionUrl: `/courses/${courseSlug}/certificate`,
    priority: NotificationPriority.HIGH,
  }),

  // ─── Learning Paths ───────────────────────────────────────────────
  pathEnrolled: (pathTitle: string, pathSlug: string): NotificationPayload => ({
    type: 'PATH_ENROLLED',
    title: `Enrolled in "${pathTitle}" path`,
    ar_title: `تم التسجيل في مسار "${pathTitle}"`,
    body: 'Your learning path has started. Stay consistent!',
    ar_body: 'بدأ مسارك التعليمي. استمر بانتظام!',
    actionUrl: `/paths/${pathSlug}`,
    priority: NotificationPriority.MEDIUM,
  }),

  pathCompleted: (
    pathTitle: string,
    pathSlug: string,
  ): NotificationPayload => ({
    type: 'PATH_COMPLETED',
    title: `🏆 Path Completed: "${pathTitle}"`,
    ar_title: `🏆 أتممت المسار: "${pathTitle}"`,
    body: 'You completed an entire learning path. Outstanding!',
    ar_body: 'أكملت مسارًا تعليميًا كاملاً. رائع!',
    actionUrl: `/paths/${pathSlug}`,
    priority: NotificationPriority.HIGH,
  }),

  // ─── Labs ─────────────────────────────────────────────────────────
  labCompleted: (labTitle: string, xp: number): NotificationPayload => ({
    type: 'LAB_COMPLETED',
    title: `✅ Lab Solved: "${labTitle}"`,
    ar_title: `✅ تم حل التحدي: "${labTitle}"`,
    body: `You earned ${xp} XP!`,
    ar_body: `حصلت على ${xp} نقطة خبرة!`,
    actionUrl: '/dashboard',
    priority: NotificationPriority.HIGH,
  }),

  // ─── Gamification ─────────────────────────────────────────────────
  badgeEarned: (badgeTitle: string): NotificationPayload => ({
    type: 'BADGE_EARNED',
    title: `🏅 Badge Earned: "${badgeTitle}"`,
    ar_title: `🏅 حصلت على شارة: "${badgeTitle}"`,
    body: 'Keep up the great work!',
    ar_body: 'واصل عملك الرائع!',
    actionUrl: '/profile#badges',
    priority: NotificationPriority.MEDIUM,
  }),

  pointsEarned: (amount: number, reason: string): NotificationPayload => ({
    type: 'POINTS_EARNED',
    title: `+${amount} Points Earned`,
    ar_title: `+${amount} نقطة مكتسبة`,
    body: reason,
    ar_body: reason,
    actionUrl: '/leaderboard',
    priority: NotificationPriority.LOW,
  }),

  leaderboardRankUp: (newRank: number): NotificationPayload => ({
    type: 'LEADERBOARD_RANK_UP',
    title: `📈 New Rank: #${newRank} on Leaderboard`,
    ar_title: `📈 ترتيب جديد: #${newRank} في المتصدرين`,
    body: 'You climbed the leaderboard! Keep it up.',
    ar_body: 'صعدت في قائمة المتصدرين! استمر.',
    actionUrl: '/leaderboard',
    priority: NotificationPriority.MEDIUM,
  }),

  xpLevelUp: (newLevel: number): NotificationPayload => ({
    type: 'XP_LEVEL_UP',
    title: `⭐ Level Up! You are now Level ${newLevel}`,
    ar_title: `⭐ ترقية! أنت الآن في المستوى ${newLevel}`,
    body: 'You reached a new level. New challenges await!',
    ar_body: 'وصلت إلى مستوى جديد. تحديات جديدة تنتظرك!',
    actionUrl: '/dashboard',
    priority: NotificationPriority.HIGH,
  }),

  // ─── Subscription ─────────────────────────────────────────────────
  subscriptionActivated: (planName: string): NotificationPayload => ({
    type: 'SUBSCRIPTION_ACTIVATED',
    title: `🎖️ Subscription Activated: ${planName}`,
    ar_title: `🎖️ تم تفعيل الاشتراك: ${planName}`,
    body: 'Enjoy full access to all premium content.',
    ar_body: 'استمتع بالوصول الكامل لجميع المحتوى المميز.',
    actionUrl: '/dashboard',
    priority: NotificationPriority.HIGH,
  }),

  subscriptionExpiringSoon: (daysLeft: number): NotificationPayload => ({
    type: 'SUBSCRIPTION_EXPIRING',
    title: `⚠️ Subscription Expiring in ${daysLeft} Days`,
    ar_title: `⚠️ اشتراكك ينتهي خلال ${daysLeft} أيام`,
    body: 'Renew now to keep your access.',
    ar_body: 'جدد الآن للحفاظ على وصولك.',
    actionUrl: '/pricing',
    priority: NotificationPriority.URGENT,
  }),

  subscriptionCancelled: (): NotificationPayload => ({
    type: 'SUBSCRIPTION_CANCELLED',
    title: 'Subscription Cancelled',
    ar_title: 'تم إلغاء الاشتراك',
    body: 'Your subscription has been cancelled. You can resubscribe anytime.',
    ar_body: 'تم إلغاء اشتراكك. يمكنك إعادة الاشتراك في أي وقت.',
    actionUrl: '/pricing',
    priority: NotificationPriority.HIGH,
  }),

  // ─── System ───────────────────────────────────────────────────────
  welcomeBack: (): NotificationPayload => ({
    type: 'SYSTEM_WELCOME_BACK',
    title: '👋 Welcome back!',
    ar_title: '👋 أهلاً بعودتك!',
    body: 'You have been inactive. Pick up where you left off.',
    ar_body: 'لم تكن نشطًا مؤخرًا. استأنف من حيث توقفت.',
    actionUrl: '/dashboard',
    priority: NotificationPriority.LOW,
  }),
};
