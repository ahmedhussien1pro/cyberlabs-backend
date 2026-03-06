// src/modules/practice-labs/ac-vuln/labs/lab3/lab3.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const acvulnLab3Metadata: LabMetadata = {
  slug: 'acvuln-horizontal-privesc-banking',
  title: 'Horizontal Privilege Escalation: Banking Account Tampering',
  ar_title: 'تصعيد الصلاحيات الأفقي: التلاعب بحسابات البنك',
  description:
    "Exploit a horizontal privilege escalation vulnerability in a banking portal by tampering with the accountNo parameter to access other customers' account balances and transaction history.",
  ar_description:
    'استغل ثغرة تصعيد الصلاحيات الأفقي في بوابة بنكية عن طريق التلاعب بمعامل accountNo للوصول إلى أرصدة وسجلات معاملات عملاء آخرين.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'Horizontal Privilege Escalation',
    'IDOR',
    'Parameter Tampering',
    'Financial Data Access',
  ],
  xpReward: 240,
  pointsReward: 120,
  duration: 45,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Access the account balance and transaction history of VIP customer "Amelia Rodriguez" (accountNo: VIP-9876-2026) to find the flag hidden in her latest high-value transaction memo.',
  ar_goal:
    'صل إلى رصيد الحساب وسجل المعاملات لعميلة VIP "Amelia Rodriguez" (accountNo: VIP-9876-2026) للعثور على العلم المخفي في مذكرة أحدث معاملة بقيمة عالية.',

  briefing: {
    en: `SecureBank Online — digital banking for everyone.
You've logged in as Bob Smith. Your account balance is modest. Your transactions are yours.
The mobile app sends your account details in the request body — standard REST design.
POST /account/balance with { "accountNo": "ACC-1234-5678" }
You get your balance back. Simple.
But wait — the accountNo is in the body. The body you control.
The server uses that accountNo to query the database.
If the server doesn't verify that this account number belongs to you...
Bob Smith has a very interesting idea.`,
    ar: `SecureBank Online — خدمات بنكية رقمية للجميع.
سجّلت الدخول بوصفك Bob Smith. رصيدك متواضع. معاملاتك خاصة بك.
يُرسل تطبيق الهاتف تفاصيل حسابك في جسم الطلب — تصميم REST قياسي.
POST /account/balance مع { "accountNo": "ACC-1234-5678" }
يُرجَع لك رصيدك. بسيط.
لكن انتظر — accountNo في الـ body. الـ body الذي تتحكم فيه.
يستخدم الخادم هذا accountNo للاستعلام من قاعدة البيانات.
إن لم يتحقق الخادم من أن هذا الرقم يخصك...
لدى Bob Smith فكرة مثيرة جداً للاهتمام.`,
  },

  stepsOverview: {
    en: [
      'Check your own account balance — observe the request body structure',
      'Test whether changing the accountNo in the body retrieves a different account',
      'Enumerate account number patterns to discover other valid formats',
      "Identify the VIP account format and access Amelia Rodriguez's transaction history",
    ],
    ar: [
      'تحقق من رصيد حسابك الخاص — لاحظ بنية جسم الطلب',
      'اختبر هل تغيير accountNo في الـ body يسترجع حساباً مختلفاً',
      'عدّد أنماط أرقام الحسابات لاكتشاف صيغ صالحة أخرى',
      'حدد صيغة حساب VIP وصل إلى سجل معاملات Amelia Rodriguez',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'SecureBank backend fetches account data based on the accountNo in the request body without verifying that the accountNo belongs to the authenticated user. Any authenticated customer can access any other account by providing its account number.',
    vulnerableCode:
      '// Backend account balance fetch (vulnerable):\n' +
      'const { accountNo } = req.body;\n' +
      'const account = await db.accounts.findOne({ accountNo });\n' +
      '// ❌ No check: does accountNo belong to authenticated user?\n' +
      'res.json({ balance: account.balance, owner: account.ownerName });',
    exploitation:
      "Change the accountNo in the request body from ACC-1234-5678 (Bob's account) to VIP-9876-2026 (Amelia's account). The server returns Amelia's balance with no ownership verification. Then repeat for POST /account/transactions to retrieve her transaction history with the embedded flag.",
    steps: {
      en: [
        'POST /account/balance with { "accountNo": "ACC-1234-5678" } → returns Bob\'s balance $5,420.75',
        'Modify body: { "accountNo": "ACC-1234-5679" } → "Account not found". Try ACC-1234-5680... try different ranges.',
        'Try VIP format: POST /account/balance with { "accountNo": "VIP-9876-2026" } → returns Amelia\'s balance $1,250,000.00',
        'POST /account/transactions with { "accountNo": "VIP-9876-2026" } → returns her transaction log',
        'Find the memo field in the latest wire_transfer_in transaction → flag is there',
      ],
      ar: [
        'POST /account/balance مع { "accountNo": "ACC-1234-5678" } → يُرجع رصيد Bob $5,420.75',
        'عدّل الـ body: { "accountNo": "ACC-1234-5679" } → "الحساب غير موجود". جرّب ACC-1234-5680... جرّب نطاقات مختلفة.',
        'جرّب صيغة VIP: POST /account/balance مع { "accountNo": "VIP-9876-2026" } → يُرجع رصيد Amelia $1,250,000.00',
        'POST /account/transactions مع { "accountNo": "VIP-9876-2026" } → يُرجع سجل معاملاتها',
        'ابحث عن حقل memo في أحدث معاملة wire_transfer_in → العلم موجود هناك',
      ],
    },
    fix: [
      'Bind accountNo to authenticated user: const account = await db.accounts.findOne({ accountNo, userId: req.user.id })',
      'Never accept account/resource identifiers from request body for ownership-sensitive operations',
      'Use the authenticated session to determine resource scope — not client-provided IDs',
      'Test every financial endpoint for horizontal access control with automated IDOR scanners',
    ],
  },

  postSolve: {
    explanation: {
      en: "Horizontal Privilege Escalation allows a user to access resources belonging to other users of the same role. Unlike vertical escalation (gaining admin from user), horizontal escalation stays within the same privilege level. It typically exploits the server's failure to verify resource ownership when processing client-supplied identifiers.",
      ar: 'يسمح تصعيد الصلاحيات الأفقي للمستخدم بالوصول إلى موارد تعود لمستخدمين آخرين من نفس الدور. على عكس التصعيد العمودي (الحصول على صلاحيات أدمن من مستخدم عادي)، يبقى التصعيد الأفقي ضمن نفس مستوى الصلاحية. يستغل عادةً إخفاق الخادم في التحقق من ملكية الموارد عند معالجة المعرفات التي يوفرها العميل.',
    },
    impact: {
      en: 'Unauthorized access to financial account data for any customer. In real banking systems this constitutes a serious regulatory violation (PCI-DSS, GDPR) and can lead to fraudulent transactions, financial intelligence gathering, and privacy law violations.',
      ar: 'وصول غير مصرّح به إلى البيانات المالية لأي عميل. في أنظمة البنوك الحقيقية يُشكّل هذا انتهاكاً تنظيمياً خطيراً (PCI-DSS وGDPR) ويمكن أن يؤدي إلى معاملات احتيالية وجمع استخباراتي مالي وانتهاكات قانون الخصوصية.',
    },
    fix: [
      "Always scope database queries to the authenticated user's ID",
      'Treat accountNo as a hint to look up, not a direct reference to return',
      "Automated testing: for each endpoint, test that user A cannot access user B's data",
      'Implement audit logging for all cross-account access attempts',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'Check your own account balance — the request body includes your accountNo. What happens if you change this to a different account number?',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'Try sequential account numbers: ACC-1234-5679, ACC-1234-5680. Some return "Account not found", others return valid data — no ownership check exists.',
    },
    {
      order: 3,
      xpCost: 45,
      content:
        'The target is a VIP customer: Amelia Rodriguez. VIP accounts use a different format: VIP-XXXX-YYYY. Try VIP-9876-2026, then also check her transaction history.',
    },
  ],

  flagAnswer: 'FLAG{HORIZONTAL_PRIVESC_BANK_IDOR_VIP_ACC}',
  initialState: {
    users: [
      { username: 'bob_smith', password: 'bobpass123', role: 'customer' },
      {
        username: 'amelia_rodriguez',
        password: 'ameliaVIP!2026',
        role: 'customer',
      },
    ],
    banks: [
      { accountNo: 'ACC-1234-5678', balance: 5420.75, ownerName: 'Bob Smith' },
      {
        accountNo: 'VIP-9876-2026',
        balance: 1250000.0,
        ownerName: 'Amelia Rodriguez',
      },
    ],
    logs: [
      {
        action: 'TRANSACTION',
        meta: {
          accountNo: 'VIP-9876-2026',
          type: 'wire_transfer_in',
          amount: 500000,
          memo: 'Confidential: FLAG{HORIZONTAL_PRIVESC_BANK_IDOR_VIP_ACC} — Annual bonus deposit',
          timestamp: '2026-03-01T14:22:00Z',
        },
      },
    ],
  },
};
