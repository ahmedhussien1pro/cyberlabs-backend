// src/modules/practice-labs/ac-vuln/labs/lab5/lab5.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const acvulnLab5Metadata: LabMetadata = {
  slug: 'acvuln-http-method-override-admin',
  title: 'HTTP Method Tampering: Hidden Admin Delete Function',
  ar_title: 'التلاعب بطريقة HTTP: وظيفة الحذف الإدارية المخفية',
  description:
    'Exploit an access control vulnerability by using HTTP method override headers to bypass role-based restrictions and execute an admin-only DELETE operation on user accounts.',
  ar_description:
    'استغل ثغرة التحكم بالوصول باستخدام headers تجاوز طريقة HTTP لتجاوز القيود القائمة على الأدوار وتنفيذ عملية DELETE إدارية على حسابات المستخدمين.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'HTTP Method Override',
    'Hidden Admin Functions',
    'REST API Security',
    'Authorization Bypass',
  ],
  xpReward: 350,
  pointsReward: 175,
  duration: 60,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Delete the "carlos" user account (admin-only operation) by exploiting HTTP method override to convert a GET request into a DELETE request that bypasses the authorization middleware.',
  ar_goal:
    'احذف حساب المستخدم "carlos" (عملية محصورة بالأدمن) باستغلال HTTP method override لتحويل طلب GET إلى طلب DELETE يتجاوز middleware التفويض.',

  briefing: {
    en: `UserHub — a SaaS user management platform — has a clean REST API.
GET /users/:username → public, returns user profile.
DELETE /users/:username → admin only, deletes the account.
You're "wiener". A regular user. Not admin.
You try to DELETE carlos. 403. Expected.
You can GET carlos just fine.
The DELETE method is protected. The GET method is open.
Two separate routes. Two separate authorization behaviors.
But the server has a feature no one talks about anymore:
HTTP method override. For legacy clients. For old firewalls.
It lets a GET pretend to be something else.
The question is: at which point in the middleware chain does authorization run?`,
    ar: `UserHub — منصة SaaS لإدارة المستخدمين — لديها REST API نظيف.
GET /users/:username → عام، يُرجع ملف تعريف المستخدم.
DELETE /users/:username → للأدمن فقط، يحذف الحساب.
أنت "wiener". مستخدم عادي. لست أدمن.
تحاول DELETE carlos. 403. متوقع.
يمكنك GET carlos بلا مشكلة.
طريقة DELETE محمية. طريقة GET مفتوحة.
مسارَان منفصلان. سلوكَا تفويض منفصلَان.
لكن الخادم لديه ميزة لا يتحدث عنها أحد بعد الآن:
تجاوز طريقة HTTP. للعملاء القديمة. لجدران الحماية القديمة.
يسمح لطلب GET بالتظاهر بأنه شيء آخر.
السؤال هو: في أي نقطة في سلسلة middleware يعمل التفويض؟`,
  },

  stepsOverview: {
    en: [
      'Confirm that DELETE /users/carlos returns 403 for regular users',
      'Confirm that GET /users/carlos returns 200 — the endpoint is public',
      'Research HTTP method override and identify the relevant headers',
      'Craft a GET request with an override header that instructs the server to treat it as DELETE',
      'Observe the middleware execution order — does authorization check the original or overridden method?',
    ],
    ar: [
      'أكّد أن DELETE /users/carlos يُرجع 403 للمستخدمين العاديين',
      'أكّد أن GET /users/carlos يُرجع 200 — نقطة النهاية عامة',
      'ابحث عن HTTP method override وحدد الـ headers ذات الصلة',
      'صمّم طلب GET مع override header يوجّه الخادم لمعالجته كـ DELETE',
      'لاحظ ترتيب تنفيذ middleware — هل يتحقق التفويض من الطريقة الأصلية أم المُحوَّلة؟',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      "UserHub REST API supports X-HTTP-Method-Override header for legacy client compatibility. A middleware processes the method override BEFORE routing, changing req.method from GET to DELETE. However, the requireAdmin authorization middleware is attached to the DELETE route — which runs AFTER routing. Since the request arrives as GET, it bypasses the GET route's (public) authorization, but the method override makes the server actually execute the DELETE handler.",
    vulnerableCode:
      '// Backend route handler:\n' +
      "app.delete('/users/:username', requireAdmin, deleteUser);\n" +
      "app.get('/users/:username', getUser);\n\n" +
      '// Middleware processes method override BEFORE routing:\n' +
      "if (req.headers['x-http-method-override']) {\n" +
      "  req.method = req.headers['x-http-method-override'];\n" +
      '}\n' +
      '// ❌ Now GET becomes DELETE, bypassing requireAdmin middleware',
    exploitation:
      'Send: GET /users/carlos with header X-HTTP-Method-Override: DELETE\n' +
      'The method override middleware changes req.method to DELETE before routing.\n' +
      'The router matches the DELETE /users/:username route.\n' +
      'But requireAdmin was checked on the ORIGINAL GET request (public) — the DELETE handler executes without admin check.',
    steps: {
      en: [
        'DELETE /users/carlos → 403 "Admin role required". Confirms DELETE is protected.',
        "GET /users/carlos → 200, returns carlos's profile. Confirms GET is public.",
        'Send GET /users/carlos with header X-HTTP-Method-Override: DELETE',
        'Server processes override → req.method becomes DELETE → matches DELETE route handler',
        'Authorization middleware ran on the original GET (public) → DELETE executes → carlos account deleted → flag returned in response',
      ],
      ar: [
        'DELETE /users/carlos → 403 "مطلوب دور المدير". يؤكد أن DELETE محمي.',
        'GET /users/carlos → 200، يُرجع ملف carlos. يؤكد أن GET عام.',
        'أرسل GET /users/carlos مع header X-HTTP-Method-Override: DELETE',
        'يعالج الخادم التجاوز → يصبح req.method هو DELETE → يطابق معالج مسار DELETE',
        'عمل middleware التفويض على GET الأصلي (العام) → ينفّذ DELETE → يُحذف حساب carlos → يُرجَع العلم في الاستجابة',
      ],
    },
    fix: [
      'Disable X-HTTP-Method-Override entirely if not required for legacy clients',
      'If needed: apply authorization checks BEFORE method override processing, not after',
      'Alternatively: re-run authorization after method override to check against the effective method',
      'Ensure DELETE, PUT, PATCH route guards cannot be bypassed via GET + override header',
    ],
  },

  postSolve: {
    explanation: {
      en: 'HTTP Method Override allows clients to tunnel HTTP methods like DELETE or PUT through GET/POST requests using headers like X-HTTP-Method-Override. This was designed for legacy firewalls that block non-GET/POST methods. The vulnerability arises when the override is processed BEFORE authorization middleware runs, causing the server to execute a privileged action while the authorization check saw only the unprivileged original method.',
      ar: 'يسمح تجاوز طريقة HTTP للعملاء بتنفيذ طرق HTTP مثل DELETE أو PUT من خلال طلبات GET/POST باستخدام headers مثل X-HTTP-Method-Override. صُمِّم هذا لجدران الحماية القديمة التي تحجب الطرق غير GET/POST. تنشأ الثغرة عندما يُعالَج التجاوز قبل تشغيل middleware التفويض، مما يجعل الخادم ينفّذ إجراءً مميزاً بينما رأى التحقق من التفويض فقط الطريقة الأصلية غير المميزة.',
    },
    impact: {
      en: 'Any regular user can delete, update, or modify any resource restricted to admin DELETE/PUT/PATCH operations. In real SaaS platforms this means unauthorized account deletion, data modification, and potential complete platform takeover without any admin credentials.',
      ar: 'يمكن لأي مستخدم عادي حذف أو تحديث أو تعديل أي مورد محصور بعمليات DELETE/PUT/PATCH الإدارية. في منصات SaaS الحقيقية هذا يعني حذف حسابات غير مصرّح به وتعديل بيانات والاستيلاء الكامل المحتمل على المنصة دون أي بيانات اعتماد إدارية.',
    },
    fix: [
      'Disable X-HTTP-Method-Override if not strictly needed for legacy support',
      'Process authorization AFTER method override — check the effective method, not the original',
      'Explicitly whitelist which methods override is allowed for — never allow GET→DELETE override',
      'Add integration tests: GET + X-HTTP-Method-Override: DELETE must return 403 for non-admin users',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 25,
      content:
        'Try DELETE /users/carlos as a regular user — 403 "Admin role required". The DELETE method is protected. But GET /users/carlos works fine. Remember this difference.',
    },
    {
      order: 2,
      xpCost: 40,
      content:
        'Research HTTP method override headers: X-HTTP-Method-Override and X-Method-Override. These let a GET request tell the server to treat it as a different method. The server supports this feature.',
    },
    {
      order: 3,
      xpCost: 60,
      content:
        'Send GET /users/carlos with the header X-HTTP-Method-Override: DELETE. Think carefully about the order of middleware execution — authorization may have already run before the method was overridden.',
    },
  ],

  flagAnswer: 'FLAG{HTTP_METHOD_OVERRIDE_ADMIN_DELETE_PWN}',
  initialState: {
    users: [
      { username: 'wiener', password: 'peter', role: 'user' },
      { username: 'carlos', password: 'montoya', role: 'user' },
      {
        username: 'administrator',
        password: 'ADM1N_ROOT_2026!',
        role: 'admin',
      },
    ],
    logs: [
      {
        action: 'USER_LOGIN',
        meta: {
          username: 'carlos',
          timestamp: '2026-03-04T08:00:00Z',
          ip: '10.0.1.50',
        },
      },
    ],
  },
};
