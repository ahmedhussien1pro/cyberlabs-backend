// src/modules/practice-labs/business-logic/labs/lab4/lab4.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const blvulnLab4Metadata: LabMetadata = {
  slug: 'blvuln-race-condition-double-spend',
  title: 'Business Logic: Race Condition — Double Spend Attack',
  ar_title: 'المنطق التجاري: حالة السباق — هجوم الإنفاق المزدوج',
  description:
    'Exploit a race condition vulnerability in a crypto wallet transfer system by sending concurrent requests to transfer the same funds twice, effectively doubling your balance.',
  ar_description:
    'استغل ثغرة حالة السباق في نظام تحويل المحفظة الرقمية بإرسال طلبات متزامنة لتحويل نفس الأموال مرتين، مما يُضاعف رصيدك فعلياً.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'Race Condition',
    'Business Logic',
    'Concurrency Exploitation',
    'Double Spend Attack',
  ],
  xpReward: 320,
  pointsReward: 160,
  duration: 55,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Start with $100 balance. Use a race condition attack to send concurrent transfer requests and end up with more than $100 across all accounts (double spend).',
  ar_goal:
    'ابدأ برصيد $100. استخدم هجوم race condition لإرسال طلبات تحويل متزامنة وانتهِ برصيد إجمالي يتجاوز $100 عبر جميع الحسابات (الإنفاق المزدوج).',

  briefing: {
    en: `CryptoVault — a digital wallet platform for crypto trading.
Your account: VAULT-A. Balance: $100.
There's a receiving account: VAULT-B. Balance: $0.
The transfer API is simple: POST /wallet/transfer with amount and destination.
You try to transfer $100 to VAULT-B. It succeeds. Balance: $0.
You try again — "Insufficient funds." Expected.
But the transfer logic reads your balance, checks it, then deducts.
Read. Check. Deduct. Three separate operations.
What happens if two transfer requests arrive at exactly the same time?
Both read: balance = $100.
Both check: $100 >= $100? Yes.
Both deduct...`,
    ar: `CryptoVault — منصة محافظ رقمية لتداول العملات المشفرة.
حسابك: VAULT-A. الرصيد: $100.
هناك حساب مستقبِل: VAULT-B. الرصيد: $0.
API التحويل بسيطة: POST /wallet/transfer مع المبلغ والوجهة.
تحاول تحويل $100 إلى VAULT-B. ينجح. الرصيد: $0.
تحاول مجدداً — "رصيد غير كافٍ." متوقع.
لكن منطق التحويل يقرأ رصيدك، يتحقق منه، ثم يخصم.
قراءة. فحص. خصم. ثلاث عمليات منفصلة.
ماذا يحدث إذا وصل طلبَا تحويل في نفس اللحظة بالضبط؟
كلاهما يقرأ: الرصيد = $100.
كلاهما يتحقق: $100 >= $100؟ نعم.
كلاهما يخصم...`,
  },

  stepsOverview: {
    en: [
      'Check your starting balance — VAULT-A: $100, VAULT-B: $0',
      'Perform a normal single transfer — confirm the balance deduction logic works correctly',
      'Understand the read-check-deduct sequence and identify where the race window exists',
      'Send two $100 transfer requests to VAULT-B simultaneously using parallel execution',
      'Check both account balances — a successful race results in more than $100 total in the system',
    ],
    ar: [
      'تحقق من الرصيد الابتدائي — VAULT-A: $100، VAULT-B: $0',
      'نفّذ تحويلاً واحداً عادياً — أكّد أن منطق خصم الرصيد يعمل بشكل صحيح',
      'افهم تسلسل القراءة-الفحص-الخصم وحدد أين توجد نافذة السباق',
      'أرسل طلبَي تحويل بقيمة $100 إلى VAULT-B في وقت واحد باستخدام التنفيذ المتوازي',
      'تحقق من أرصدة كلا الحسابَين — يؤدي نجاح السباق إلى أكثر من $100 إجمالاً في النظام',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'CryptoVault transfer handler reads sender balance, checks sufficiency, then deducts — three separate non-atomic DB operations. With no locking mechanism, two concurrent requests both read balance = $100 before either deduction completes, both pass the check, and both execute the deduction — resulting in $200 being credited from a $100 account.',
    vulnerableCode:
      '// Transfer handler (vulnerable):\n' +
      'async function transfer(fromId, toId, amount) {\n' +
      '  const sender = await db.wallets.findOne({ id: fromId });\n' +
      '  // ❌ Race window here — two threads both read balance = 100\n' +
      "  if (sender.balance < amount) throw new Error('Insufficient funds');\n" +
      '  // ❌ Both threads pass the check and both deduct!\n' +
      '  await db.wallets.update({ id: fromId, balance: sender.balance - amount });\n' +
      '  await db.wallets.update({ id: toId, balance: toId.balance + amount });\n' +
      '}',
    exploitation:
      'Send 2 concurrent POST /wallet/transfer { "toAccount": "VAULT-B", "amount": 100 } requests simultaneously.\n' +
      'Both read VAULT-A balance = $100 before either write completes.\n' +
      'Both pass the balance check.\n' +
      'Both deduct $100 from VAULT-A and credit $100 to VAULT-B.\n' +
      'Result: VAULT-A = -$100 (or $0 depending on write order), VAULT-B = $200. Total in system = $200 from original $100.',
    steps: {
      en: [
        'GET /wallet/balance → VAULT-A: $100, VAULT-B: $0',
        'Single transfer test: POST /wallet/transfer { "toAccount": "VAULT-B", "amount": 50 } → VAULT-A: $50, VAULT-B: $50. Confirms normal flow works.',
        'Reset or use fresh accounts. Now prepare 2 parallel requests: POST /wallet/transfer { "toAccount": "VAULT-B", "amount": 100 }',
        'Execute both simultaneously using Promise.all() or Burp Turbo Intruder in parallel mode',
        'GET /wallet/balance → if race succeeded: VAULT-B = $200 (or both have $100), VAULT-A ≤ $0. Total > $100. Flag returned.',
      ],
      ar: [
        'GET /wallet/balance → VAULT-A: $100، VAULT-B: $0',
        'اختبار تحويل واحد: POST /wallet/transfer { "toAccount": "VAULT-B", "amount": 50 } → VAULT-A: $50، VAULT-B: $50. يؤكد أن التدفق الطبيعي يعمل.',
        'أعد التعيين أو استخدم حسابات جديدة. جهّز الآن طلبَين متوازيَين: POST /wallet/transfer { "toAccount": "VAULT-B", "amount": 100 }',
        'نفّذ كليهما في وقت واحد باستخدام Promise.all() أو Burp Turbo Intruder في الوضع المتوازي',
        'GET /wallet/balance → إن نجح السباق: VAULT-B = $200 (أو كلاهما بـ $100)، VAULT-A ≤ $0. الإجمالي > $100. يُرجَع العلم.',
      ],
    },
    fix: [
      'Use atomic DB operations: UPDATE wallets SET balance = balance - amount WHERE id = fromId AND balance >= amount',
      'The single-query approach naturally prevents race conditions — it reads and writes atomically',
      'Use database transactions with SELECT FOR UPDATE to lock the row during the read-check-write sequence',
      'Application-level mutex per account: queue concurrent transfers for the same account',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Double Spend via Race Condition exploits the non-atomic read-check-write pattern in financial systems. When balance check and deduction are separate operations, concurrent requests can both pass the check before either completes the deduction. This is a classic TOCTOU (Time-Of-Check-Time-Of-Use) vulnerability applied to financial logic — the same class of bug that enabled the Mt. Gox Bitcoin exchange hack.',
      ar: 'يستغل الإنفاق المزدوج عبر Race Condition نمط القراءة-الفحص-الكتابة غير الذري في الأنظمة المالية. عندما تكون عملية فحص الرصيد والخصم عمليتَين منفصلتَين، يمكن للطلبات المتزامنة أن تتجاوز كلتاهما الفحص قبل اكتمال أي خصم. هذه ثغرة TOCTOU كلاسيكية مطبَّقة على المنطق المالي — نفس نوع الخطأ الذي مكّن من اختراق بورصة Mt. Gox للبيتكوين.',
    },
    impact: {
      en: "Unlimited fund creation from thin air. A successful double-spend attack allows extracting more money than exists in an account. At scale with automation, this can drain an entire platform's financial reserves in minutes. This vulnerability class has cost the crypto industry billions of dollars historically.",
      ar: 'إنشاء أموال لا محدودة من لا شيء. يسمح هجوم الإنفاق المزدوج الناجح باستخراج أموال أكثر مما يوجد في الحساب. على نطاق واسع مع الأتمتة، يمكن هذا من استنزاف الاحتياطيات المالية الكاملة لمنصة في دقائق. كلّف هذا النوع من الثغرات صناعة العملات المشفرة تاريخياً مليارات الدولارات.',
    },
    fix: [
      'Atomic balance check-and-deduct in a single SQL statement with WHERE balance >= amount',
      'Database row-level locking (SELECT FOR UPDATE) for all financial read-modify-write operations',
      'Idempotency keys: each transfer request gets a unique key that prevents duplicate processing',
      'Queue-based architecture: serialize transfers per account to eliminate concurrency entirely',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 20,
      content:
        'Check your balance: $100. Try transferring $100 to VAULT-B normally — succeeds. Try again — fails with "Insufficient funds." Now: what if both requests arrive before either deduction is written?',
    },
    {
      order: 2,
      xpCost: 35,
      content:
        'The transfer reads balance, then checks, then deducts — three separate DB operations. Send 2 transfer requests of $100 at EXACTLY the same time using parallel execution (Promise.all, curl --parallel, or Burp Turbo Intruder).',
    },
    {
      order: 3,
      xpCost: 55,
      content:
        "After the parallel transfer: check both account balances. If race succeeded, the total money in the system exceeds the original $100 — that's your double spend confirmation. The flag appears in the balance response.",
    },
  ],

  flagAnswer: 'FLAG{BL_RACE_CONDITION_DOUBLE_SPEND_CRYPTO_VAULT}',
  initialState: {
    banks: [
      { accountNo: 'VAULT-A', balance: 100, ownerName: 'Attacker Account' },
      { accountNo: 'VAULT-B', balance: 0, ownerName: 'Receiving Account' },
    ],
  },
};
