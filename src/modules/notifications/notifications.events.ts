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
  // ─── Auth ──────────────────────────────────────────────────────────
  login: (name?: string, ip?: string): NotificationPayload => ({
    type: 'AUTH_LOGIN',
    title: name ? `Welcome back, ${name}! 👋` : 'New Login Detected',
    ar_title: name ? `أهلاً بعودتك، ${name}! 👋` : 'تم تسجيل دخول جديد',
    body: ip
      ? `Heads up! We detected a login from IP: ${ip}. If this wasn't you, secure your account immediately.`
      : `You logged in successfully. Stay safe out there, hacker! 🔐`,
    ar_body: ip
      ? `تنبيه! اكتشفنا تسجيل دخول من IP: ${ip}. إذا لم تكن أنت، قم بتغيير كلمة المرور فوراً.`
      : `تم تسجيل دخولك بنجاح. ابقَ بأمان يا هاكر! 🔐`,
    actionUrl: ip ? '/settings/security' : '/dashboard',
    priority: ip ? NotificationPriority.URGENT : NotificationPriority.LOW,
  }),

  suspiciousLogin: (ip: string): NotificationPayload => ({
    type: 'AUTH_SUSPICIOUS_LOGIN',
    title: '🚨 Suspicious Login Detected!',
    ar_title: '🚨 تسجيل دخول مشبوه!',
    body: `We detected an unexpected login from IP: ${ip}. If this wasn't you, change your password immediately and enable 2FA.`,
    ar_body: `اكتشفنا تسجيل دخول غير متوقع من IP: ${ip}. إذا لم تكن أنت، غيّر كلمة مرورك فوراً وفعّل التحقق بخطوتين.`,
    actionUrl: '/settings/security',
    priority: NotificationPriority.URGENT,
  }),

  register: (name: string): NotificationPayload => ({
    type: 'AUTH_REGISTER',
    title: `🎉 Welcome to CyberLabs, ${name}!`,
    ar_title: `🎉 أهلاً وسهلاً في CyberLabs، ${name}!`,
    body: 'Your account is ready. Dive into labs, earn badges, and become a cybersecurity pro!',
    ar_body:
      'حسابك جاهز! ادخل عالم الـ Labs، اكسب الشارات، وكن محترفاً في الأمن السيبراني!',
    actionUrl: '/dashboard',
    priority: NotificationPriority.HIGH,
  }),

  passwordChanged: (): NotificationPayload => ({
    type: 'AUTH_PASSWORD_CHANGED',
    title: '🔒 Password Changed Successfully',
    ar_title: '🔒 تم تغيير كلمة المرور',
    body: 'Your password was updated. If you did not make this change, contact support immediately.',
    ar_body:
      'تم تحديث كلمة مرورك. إذا لم تكن أنت من فعل ذلك، تواصل مع الدعم فوراً.',
    actionUrl: '/settings/security',
    priority: NotificationPriority.HIGH,
  }),

  passwordResetRequested: (): NotificationPayload => ({
    type: 'AUTH_PASSWORD_RESET',
    title: '📧 Password Reset Link Sent',
    ar_title: '📧 تم إرسال رابط إعادة تعيين كلمة المرور',
    body: 'Check your inbox — a password reset link has been sent to your email.',
    ar_body:
      'تحقق من بريدك — تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني.',
    actionUrl: '/settings/security',
    priority: NotificationPriority.URGENT,
  }),

  emailVerified: (): NotificationPayload => ({
    type: 'AUTH_EMAIL_VERIFIED',
    title: '✅ Email Verified!',
    ar_title: '✅ تم التحقق من البريد الإلكتروني!',
    body: 'Your email is now verified. Full platform access is unlocked.',
    ar_body: 'تم التحقق من بريدك الإلكتروني. الوصول الكامل للمنصة مفتوح الآن.',
    actionUrl: '/dashboard',
    priority: NotificationPriority.MEDIUM,
  }),

  twoFactorEnabled: (): NotificationPayload => ({
    type: 'AUTH_2FA_ENABLED',
    title: '🛡️ Two-Factor Authentication Enabled',
    ar_title: '🛡️ تم تفعيل التحقق بخطوتين',
    body: 'Great move! Your account is now protected by 2FA.',
    ar_body: 'قرار ممتاز! حسابك محمي الآن بالتحقق بخطوتين.',
    actionUrl: '/settings/security',
    priority: NotificationPriority.MEDIUM,
  }),

  // ─── Courses ──────────────────────────────────────────────────────
  courseEnrolled: (
    courseTitle: string,
    courseSlug: string,
  ): NotificationPayload => ({
    type: 'COURSE_ENROLLED',
    title: `📚 You're enrolled in "${courseTitle}"`,
    ar_title: `📚 تم تسجيلك في كورس "${courseTitle}"`,
    body: `Your learning journey starts now! Consistency is the key to mastery.`,
    ar_body: `رحلتك التعليمية بدأت الآن! الاستمرارية هي مفتاح الإتقان.`,
    actionUrl: `/courses/${courseSlug}`,
    priority: NotificationPriority.MEDIUM,
  }),

  courseCompleted: (
    courseTitle: string,
    courseSlug: string,
  ): NotificationPayload => ({
    type: 'COURSE_COMPLETED',
    title: `🏆 Course Completed: "${courseTitle}"`,
    ar_title: `🏆 أتممت كورس: "${courseTitle}"`,
    body: `Outstanding achievement! You've completed the entire course. Your certificate is ready to download.`,
    ar_body: `إنجاز رائع! لقد أكملت الكورس بالكامل. شهادتك جاهزة للتحميل الآن.`,
    actionUrl: `/courses/${courseSlug}/certificate`,
    priority: NotificationPriority.HIGH,
  }),

  // ─── Labs ─────────────────────────────────────────────────────────
  labCompleted: (
    labTitle: string,
    xp: number,
    points: number,
  ): NotificationPayload => ({
    type: 'LAB_COMPLETED',
    title: `🎯 Challenge Solved: "${labTitle}"`,
    ar_title: `🎯 حللت التحدي: "${labTitle}"`,
    body: `Excellent work! You cracked it and earned +${xp} XP and +${points} points. Keep hacking!`,
    ar_body: `عمل ممتاز! كسرت التحدي وحصلت على +${xp} XP و +${points} نقطة. استمر في الاختراق!`,
    actionUrl: '/practice-labs',
    priority: NotificationPriority.HIGH,
  }),

  // ─── Gamification ─────────────────────────────────────────────────
  badgeEarned: (
    badgeTitle: string,
    arBadgeTitle: string,
  ): NotificationPayload => ({
    type: 'BADGE_EARNED',
    title: `🏅 New Badge Unlocked: "${badgeTitle}"`,
    ar_title: `🏅 شارة جديدة: "${arBadgeTitle}"`,
    body: `You earned the "${badgeTitle}" badge. Your skills are showing! Check your profile.`,
    ar_body: `حصلت على شارة "${arBadgeTitle}". مهاراتك تتطور! تحقق من ملفك الشخصي.`,
    actionUrl: '/profile#badges',
    priority: NotificationPriority.HIGH,
  }),

  xpLevelUp: (newLevel: number): NotificationPayload => ({
    type: 'XP_LEVEL_UP',
    title: `⭐ Level Up! You're now Level ${newLevel}`,
    ar_title: `⭐ ترقية مستوى! أنت الآن في المستوى ${newLevel}`,
    body: `You've reached Level ${newLevel}! New challenges and content await you.`,
    ar_body: `وصلت إلى المستوى ${newLevel}! تحديات ومحتوى جديد ينتظرك.`,
    actionUrl: '/dashboard',
    priority: NotificationPriority.HIGH,
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
    title: `📈 New Rank: #${newRank}`,
    ar_title: `📈 ترتيب جديد: #${newRank}`,
    body: 'You climbed the leaderboard! Keep pushing.',
    ar_body: 'صعدت في قائمة المتصدرين! واصل المجهود.',
    actionUrl: '/leaderboard',
    priority: NotificationPriority.MEDIUM,
  }),

  // ─── Subscription ──────────────────────────────────────────────────
  subscriptionActivated: (planName: string): NotificationPayload => ({
    type: 'SUBSCRIPTION_ACTIVATED',
    title: `🎖️ Subscription Activated: ${planName}`,
    ar_title: `🎖️ تم تفعيل الاشتراك: ${planName}`,
    body: 'You now have full access to all premium labs and courses. Time to hack!',
    ar_body:
      'أصبح لديك وصول كامل لجميع الـ Labs والكورسات المميزة. حان وقت الاختراق!',
    actionUrl: '/dashboard',
    priority: NotificationPriority.HIGH,
  }),

  subscriptionExpiringSoon: (daysLeft: number): NotificationPayload => ({
    type: 'SUBSCRIPTION_EXPIRING',
    title: `⚠️ Subscription Expiring in ${daysLeft} Days`,
    ar_title: `⚠️ اشتراكك ينتهي خلال ${daysLeft} أيام`,
    body: 'Renew now to keep your momentum going.',
    ar_body: 'جدد الآن للحفاظ على تقدمك.',
    actionUrl: '/pricing',
    priority: NotificationPriority.URGENT,
  }),

  subscriptionCancelled: (): NotificationPayload => ({
    type: 'SUBSCRIPTION_CANCELLED',
    title: 'Subscription Cancelled',
    ar_title: 'تم إلغاء الاشتراك',
    body: 'Your subscription has ended. You can resubscribe anytime.',
    ar_body: 'انتهى اشتراكك. يمكنك إعادة الاشتراك في أي وقت.',
    actionUrl: '/pricing',
    priority: NotificationPriority.HIGH,
  }),

  welcomeBack: (name?: string): NotificationPayload => ({
    type: 'SYSTEM_WELCOME_BACK',
    title: name ? `👋 Welcome back, ${name}!` : '👋 Welcome back!',
    ar_title: name ? `👋 أهلاً بعودتك، ${name}!` : '👋 أهلاً بعودتك!',
    body: 'You have been away for a while. Pick up where you left off!',
    ar_body: 'لم تكن نشطاً مؤخراً. استأنف من حيث توقفت!',
    actionUrl: '/dashboard',
    priority: NotificationPriority.LOW,
  }),

  // ─── Learning Paths ────────────────────────────────────────────────
  pathEnrolled: (pathTitle: string, pathSlug: string): NotificationPayload => ({
    type: 'PATH_ENROLLED',
    title: `🗺️ Learning Path Started: "${pathTitle}"`,
    ar_title: `🗺️ بدأت مسار: "${pathTitle}"`,
    body: 'Your learning path is set. Stay consistent and you will reach the end!',
    ar_body: 'مسارك التعليمي محدد. استمر بانتظام وستصل للنهاية!',
    actionUrl: `/paths/${pathSlug}`,
    priority: NotificationPriority.MEDIUM,
  }),

  pathCompleted: (
    pathTitle: string,
    pathSlug: string,
  ): NotificationPayload => ({
    type: 'PATH_COMPLETED',
    title: `🏆 Learning Path Completed: "${pathTitle}"`,
    ar_title: `🏆 أتممت المسار: "${pathTitle}"`,
    body: 'You completed an entire learning path! That is elite-level dedication.',
    ar_body: 'أكملت مساراً تعليمياً كاملاً! هذا مستوى النخبة.',
    actionUrl: `/paths/${pathSlug}`,
    priority: NotificationPriority.HIGH,
  }),
};
