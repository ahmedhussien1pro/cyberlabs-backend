// src/modules/practice-labs/ac-vuln/labs/lab2/lab2.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const acvulnLab2Metadata: LabMetadata = {
  slug: 'acvuln-vertical-privilege-escalation',
  title: 'Vertical Privilege Escalation: Admin Role Header Injection',
  ar_title: 'تصعيد الصلاحيات العمودي: حقن header دور المسؤول',
  description:
    'Exploit a vertical privilege escalation vulnerability in an e-commerce admin panel by injecting a custom X-User-Role header to bypass role-based access control.',
  ar_description:
    'استغل ثغرة تصعيد الصلاحيات العمودي في لوحة إدارة متجر إلكتروني عن طريق حقن header مخصص X-User-Role لتجاوز التحكم بالوصول القائم على الأدوار.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'Vertical Privilege Escalation',
    'HTTP Header Injection',
    'Role-Based Access Control Bypass',
    'Admin Panel Access',
  ],
  xpReward: 220,
  pointsReward: 110,
  duration: 40,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Access the /admin/users endpoint (restricted to admin role) by injecting a crafted X-User-Role header to escalate your privileges from "customer" to "admin".',
  ar_goal:
    'صل إلى نقطة /admin/users المقيّدة بدور المدير عبر حقن X-User-Role header لتصعيد صلاحياتك من "customer" إلى "admin".',

  briefing: {
    en: `TechStore — a mid-size online electronics retailer — has an admin dashboard.
You're a regular customer. Logged in. Browsing your past orders.
The dashboard is off limits. 403 Forbidden. Clear enough.
But while inspecting your own requests in Burp, you notice something odd:
every request you make automatically sends a header.
X-User-Role: customer
Wait. Why is the CLIENT telling the SERVER its own role?
Shouldn't the server already know who you are?
There's something wrong with this architecture.`,
    ar: `TechStore — متجر إلكتروني متوسط الحجم لبيع الإلكترونيات — لديه لوحة إدارة.
أنت عميل عادي. مسجّل الدخول. تتصفح طلباتك السابقة.
لوحة الإدارة محظورة. 403 Forbidden. واضح تماماً.
لكن أثناء فحص طلباتك في Burp، تلاحظ شيئاً غريباً:
كل طلب ترسله يتضمن تلقائياً header.
X-User-Role: customer
لحظة. لماذا يخبر العميل الخادم بدوره الخاص؟
أليس من المفترض أن يعرف الخادم بالفعل من أنت؟
هناك خطأ ما في هذه البنية.`,
  },

  stepsOverview: {
    en: [
      'Attempt to access the admin endpoint as a regular customer — observe the 403 response',
      'Inspect the HTTP headers being sent in your requests — look for anything unusual',
      'Understand how the backend determines your role — is it from the JWT or from a header?',
      'Modify the role header and resend the request to the admin endpoint',
    ],
    ar: [
      'حاول الوصول إلى نقطة الأدمن كعميل عادي — لاحظ استجابة 403',
      'افحص HTTP headers المُرسَلة في طلباتك — ابحث عن أي شيء غير معتاد',
      'افهم كيف يحدد الـ backend دورك — هل من الـ JWT أم من header؟',
      'عدّل header الدور وأعد إرسال الطلب إلى نقطة الأدمن',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'TechStore backend reads authorization role from the X-User-Role request header instead of extracting it from the JWT token. This header is intended for internal microservice communication but was mistakenly exposed to external clients. Any external client can freely set it to "admin".',
    vulnerableCode:
      '// Backend authorization check (vulnerable):\n' +
      "const userRole = req.headers['x-user-role'] || 'customer';\n" +
      '// ❌ Trusting client-supplied header instead of JWT payload\n' +
      "if (userRole !== 'admin') {\n" +
      "  return res.status(403).json({ error: 'Forbidden' });\n" +
      '}\n' +
      '// Admin logic proceeds...',
    exploitation:
      "Add the header X-User-Role: admin to any request targeting the /admin/users endpoint. The backend reads this header as the source of truth for the user's role, bypassing the JWT-based authorization entirely.",
    steps: {
      en: [
        'GET /admin/users (no special headers) → 403 "Admin role required"',
        'Inspect outgoing requests in Burp Suite — notice X-User-Role: customer is sent automatically by the frontend',
        'Intercept the request to /admin/users and modify the header to X-User-Role: admin',
        'Forward the modified request → 200 OK, admin user list returned',
        'Find the flag embedded in the admin_system account details',
      ],
      ar: [
        'GET /admin/users (بدون headers خاصة) → 403 "مطلوب دور المدير"',
        'افحص الطلبات الصادرة في Burp Suite — لاحظ إرسال X-User-Role: customer تلقائياً بواسطة الواجهة الأمامية',
        'اعترض الطلب إلى /admin/users وعدّل الـ header إلى X-User-Role: admin',
        'أعد توجيه الطلب المعدَّل → 200 OK، تُرجع قائمة مستخدمي الأدمن',
        'ابحث عن العلم المضمَّن في تفاصيل حساب admin_system',
      ],
    },
    fix: [
      'Always extract user role from the verified JWT payload — never from request headers',
      'Strip all internal microservice headers (X-User-Role, X-Internal-*) at the API gateway before they reach application code',
      "Use middleware that reads: const userRole = req.user.role (from JWT) — never req.headers['x-user-role']",
      'Validate JWT on every request and enforce RBAC based solely on token claims',
    ],
  },

  postSolve: {
    explanation: {
      en: 'Vertical Privilege Escalation occurs when a lower-privileged user gains access to functionality reserved for higher-privileged roles. When authorization decisions rely on client-supplied headers instead of server-verified tokens, any user can escalate their privileges by simply modifying the header value.',
      ar: 'يحدث تصعيد الصلاحيات العمودي عندما يحصل مستخدم ذو صلاحيات منخفضة على وصول إلى وظائف محجوزة لأدوار أعلى صلاحية. عندما تعتمد قرارات التفويض على headers يوفرها العميل بدلاً من tokens مُتحقَّق منها بواسطة الخادم، يمكن لأي مستخدم تصعيد صلاحياته بمجرد تعديل قيمة الـ header.',
    },
    impact: {
      en: 'Full admin panel access. Attacker can view all customer accounts, order data, and perform admin operations. In real systems this means customer PII exposure, unauthorized data modification, and potential full system takeover.',
      ar: 'وصول كامل للوحة الإدارة. يمكن للمهاجم عرض جميع حسابات العملاء وبيانات الطلبات وتنفيذ عمليات إدارية. في الأنظمة الحقيقية هذا يعني كشف PII للعملاء وتعديل البيانات غير المصرّح به والاستيلاء الكامل المحتمل على النظام.',
    },
    fix: [
      'Role must be extracted from verified JWT: req.user.role (never req.headers)',
      'API Gateway: strip all X-Internal-* headers from external requests',
      'Periodic authorization review: audit all RBAC checks in codebase',
      'Integration tests: verify 403 for every admin endpoint with non-admin credentials',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'Try accessing GET /admin/users as a regular customer — 403. The error says "Admin role required." How exactly does the backend know your role? Is it from your JWT?',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'Inspect your outgoing request headers carefully. You might see X-User-Role: customer being sent. Why would the client declare its own role to the server?',
    },
    {
      order: 3,
      xpCost: 50,
      content:
        'Try modifying that header: send GET /admin/users with X-User-Role: admin and observe the difference.',
    },
  ],

  flagAnswer: 'FLAG{VERTICAL_PRIVESC_ROLE_HEADER_BYPASS_X42}',
  initialState: {
    users: [
      { username: 'customer_john', password: 'john123', role: 'customer' },
      { username: 'customer_alice', password: 'alice456', role: 'customer' },
      {
        username: 'admin_system',
        password: 'ADM1N_S3CUR3_P@SS!',
        role: 'admin',
      },
    ],
    contents: [
      {
        title: 'Order #1001',
        body: JSON.stringify({
          customer: 'customer_john',
          total: 299.99,
          items: 3,
        }),
        author: 'customer_john',
      },
      {
        title: 'Order #1002',
        body: JSON.stringify({
          customer: 'customer_alice',
          total: 549.99,
          items: 5,
        }),
        author: 'customer_alice',
      },
    ],
  },
};
