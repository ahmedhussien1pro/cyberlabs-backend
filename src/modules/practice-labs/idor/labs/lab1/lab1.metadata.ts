// src/modules/practice-labs/idor/labs/lab1/lab1.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const idorLab1Metadata: LabMetadata = {
  slug: 'idor-order-tracking-delivery',
  title: 'IDOR: Order Tracking — Shipment Details Leak',
  ar_title: 'IDOR: تتبع الطلبات — تسريب تفاصيل الشحنة',
  description:
    "Exploit an IDOR vulnerability in a delivery platform where shipment order IDs are sequential and predictable. Access other users' shipment details including a VIP classified shipment to retrieve the flag.",
  ar_description:
    'استغل ثغرة IDOR في منصة توصيل حيث معرفات طلبات الشحن تسلسلية ويمكن التنبؤ بها. اصل إلى تفاصيل شحنات المستخدمين الآخرين بما فيها شحنة VIP سرية لاسترداد العلم.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  skills: [
    'IDOR',
    'Object Reference Manipulation',
    'Sequential ID Enumeration',
    'Information Disclosure',
  ],
  xpReward: 120,
  pointsReward: 60,
  duration: 25,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Your order is ORD-1001. Enumerate order IDs to find the VIP classified shipment (ORD-10XX) and access its confidential delivery details to retrieve the flag.',
  ar_goal:
    'طلبك هو ORD-1001. عدّد معرفات الطلبات للعثور على الشحنة السرية VIP (ORD-10XX) والوصول إلى تفاصيل التوصيل السرية لاسترداد العلم.',

  briefing: {
    en: `TrackShip — a logistics platform connecting thousands of businesses across the region.
You are john_doe. You ordered electronics. ORD-1001.
You open the tracking page: /orders/ORD-1001
Full details. Your cargo. Your destination. Your status.
Clean interface. Very professional.
You try /orders/ORD-1002.
Sara's order. Clothing. Alexandria. Delivered.
The server didn't ask any questions.
It didn't check if ORD-1002 is yours.
It just returned it.
You keep going.
ORD-1003. ORD-1004. ORD-1005...
Something classified is in here.
The question is — which one?`,
    ar: `TrackShip — منصة لوجستية تربط آلاف الشركات عبر المنطقة.
أنت john_doe. طلبت إلكترونيات. ORD-1001.
تفتح صفحة التتبع: /orders/ORD-1001
تفاصيل كاملة. شحنتك. وجهتك. حالتك.
واجهة نظيفة. احترافية جداً.
تحاول /orders/ORD-1002.
طلب سارة. ملابس. الإسكندرية. تم التوصيل.
الخادم لم يطرح أي سؤال.
لم يتحقق إن كان ORD-1002 ملكك.
أعاده فقط.
تواصل.
ORD-1003. ORD-1004. ORD-1005...
شيء مُصنَّف موجود هنا.
السؤال هو — أيّها؟`,
  },

  stepsOverview: {
    en: [
      'Request GET /orders/ORD-1001 — your own order, confirm response format',
      "Try GET /orders/ORD-1002 — another user's order, confirm no ownership check",
      'Enumerate ORD-1001 through ORD-1010 sequentially',
      'Identify the VIP/CLASSIFIED order with a flag in its cargo details',
    ],
    ar: [
      'اطلب GET /orders/ORD-1001 — طلبك الخاص، أكّد تنسيق الاستجابة',
      'جرّب GET /orders/ORD-1002 — طلب مستخدم آخر، أكّد غياب التحقق من الملكية',
      'عدّد من ORD-1001 إلى ORD-1010 بشكل تسلسلي',
      'حدد الطلب VIP/CLASSIFIED الذي يحتوي على علم في تفاصيل الشحنة',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'TrackShip order tracking endpoint fetches order by ID without verifying order.userId === req.user.id. Sequential integer IDs (ORD-1001 through ORD-1010) allow trivial enumeration. ORD-1007 is a government-classified VIP shipment containing the flag.',
    vulnerableCode:
      '// Order tracking endpoint (vulnerable):\n' +
      "app.get('/orders/:orderId', async (req, res) => {\n" +
      '  const order = await db.orders.findOne({ id: req.params.orderId });\n' +
      "  if (!order) return res.status(404).json({ error: 'Order not found' });\n" +
      '  // ❌ No ownership check: order.userId !== req.user.id\n' +
      '  res.json(order);\n' +
      '});',
    exploitation:
      'GET /orders/ORD-1007 — returns government VIP shipment with classification: "TOP SECRET" and flag in cargo field.',
    steps: {
      en: [
        'GET /orders/ORD-1001 → your order, cargo: Electronics, owner: john_doe',
        "GET /orders/ORD-1002 → Sara's order returned without error → IDOR confirmed",
        'Enumerate GET /orders/ORD-1003 through ORD-1007',
        'GET /orders/ORD-1007 → cargo: "CLASSIFIED — Government Documents", classification: "TOP SECRET", flag: FLAG{IDOR_ORDER_TRACKING_SEQUENTIAL_ID_ENUMERATION}',
      ],
      ar: [
        'GET /orders/ORD-1001 → طلبك، cargo: Electronics، owner: john_doe',
        'GET /orders/ORD-1002 → طلب سارة مُعاد بدون خطأ → تم تأكيد IDOR',
        'عدّد GET /orders/ORD-1003 إلى ORD-1007',
        'GET /orders/ORD-1007 → cargo: "CLASSIFIED — Government Documents"، classification: "TOP SECRET"، flag: FLAG{IDOR_ORDER_TRACKING_SEQUENTIAL_ID_ENUMERATION}',
      ],
    },
    fix: [
      'Always verify ownership: if (order.userId !== req.user.id) return 403 Forbidden',
      'Use GUIDs/UUIDs instead of sequential integers — unpredictable IDs drastically reduce enumeration risk',
      'Apply object-level authorization checks at every endpoint that retrieves user-specific data',
      'Log and alert on sequential ID access patterns — enumeration is detectable',
    ],
  },

  postSolve: {
    explanation: {
      en: 'IDOR (Insecure Direct Object Reference) occurs when an application uses user-controllable input to access objects directly without authorization checks. Sequential integer IDs (1, 2, 3...) make enumeration trivial — an attacker who knows their own ID can predict and access all others. This is consistently ranked in the OWASP Top 10 as a Broken Object Level Authorization (BOLA) vulnerability.',
      ar: 'يحدث IDOR (المرجع المباشر غير الآمن للكائنات) عندما يستخدم التطبيق مدخلات يتحكم فيها المستخدم للوصول إلى الكائنات مباشرة بدون فحوصات تفويض. المعرفات الصحيحة التسلسلية (1، 2، 3...) تجعل التعداد تافهاً — المهاجم الذي يعرف معرّفه الخاص يمكنه التنبؤ بجميع المعرفات الأخرى والوصول إليها. يُصنَّف هذا باستمرار في قائمة OWASP Top 10 كثغرة Broken Object Level Authorization (BOLA).',
    },
    impact: {
      en: 'Full data breach across all user records. In logistics: shipment routes, cargo contents, recipient addresses exposed. In this scenario, a classified government shipment with its route, destination, and contents was fully exposed to any authenticated user.',
      ar: 'خرق بيانات كامل عبر جميع سجلات المستخدمين. في اللوجستيات: مسارات الشحن ومحتويات الشحنة وعناوين المستلمين مكشوفة. في هذا السيناريو، شحنة حكومية مُصنَّفة مع مسارها ووجهتها ومحتوياتها مكشوفة بالكامل لأي مستخدم مصادَق عليه.',
    },
    fix: [
      'Object-level authorization: EVERY data retrieval must verify ownership or permission',
      'Non-sequential IDs: use UUIDs (e.g., f47ac10b-58cc-4372-a567-0e02b2c3d479) instead of ORD-1001',
      "Centralized authorization middleware: don't duplicate ownership checks per endpoint",
      'API testing: include IDOR test cases in your security test suite for every data endpoint',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        "Your order ID is ORD-1001. What happens if you request ORD-1002? Does the server check if it's your order? Try it and observe the response.",
    },
    {
      order: 2,
      xpCost: 20,
      content:
        'Order IDs are sequential. Try ORD-1001 through ORD-1010 one by one. Look for an order with an unusual owner or a classified/restricted status.',
    },
    {
      order: 3,
      xpCost: 35,
      content:
        'The VIP classified shipment is somewhere between ORD-1005 and ORD-1010. It has classification: "TOP SECRET" and owner: "gov_agency_001".',
    },
  ],

  flagAnswer: 'FLAG{IDOR_ORDER_TRACKING_SEQUENTIAL_ID_ENUMERATION}',
  initialState: {
    contents: [
      {
        title: 'ORD-1001',
        body: JSON.stringify({
          cargo: 'Electronics',
          destination: 'Cairo',
          status: 'In Transit',
          owner: 'john_doe',
          isVIP: false,
        }),
        author: 'shipment',
        isPublic: false,
      },
      {
        title: 'ORD-1002',
        body: JSON.stringify({
          cargo: 'Clothing',
          destination: 'Alex',
          status: 'Delivered',
          owner: 'sara_m',
          isVIP: false,
        }),
        author: 'shipment',
        isPublic: false,
      },
      {
        title: 'ORD-1003',
        body: JSON.stringify({
          cargo: 'Books',
          destination: 'Giza',
          status: 'Pending',
          owner: 'ahmed_k',
          isVIP: false,
        }),
        author: 'shipment',
        isPublic: false,
      },
      {
        title: 'ORD-1004',
        body: JSON.stringify({
          cargo: 'Medical Supplies',
          destination: 'Luxor',
          status: 'In Transit',
          owner: 'dr_mona',
          isVIP: false,
        }),
        author: 'shipment',
        isPublic: false,
      },
      {
        title: 'ORD-1005',
        body: JSON.stringify({
          cargo: 'Industrial Parts',
          destination: 'Port Said',
          status: 'Pending',
          owner: 'factory_co',
          isVIP: false,
        }),
        author: 'shipment',
        isPublic: false,
      },
      {
        title: 'ORD-1006',
        body: JSON.stringify({
          cargo: 'Jewelry',
          destination: 'Sharm',
          status: 'In Transit',
          owner: 'luxury_shop',
          isVIP: false,
        }),
        author: 'shipment',
        isPublic: false,
      },
      {
        title: 'ORD-1007',
        body: JSON.stringify({
          cargo: 'CLASSIFIED — Government Documents',
          destination: 'Cairo Intelligence HQ',
          status: 'RESTRICTED',
          owner: 'gov_agency_001',
          isVIP: true,
          classification: 'TOP SECRET',
          flag: 'FLAG{IDOR_ORDER_TRACKING_SEQUENTIAL_ID_ENUMERATION}',
        }),
        author: 'vip_shipment',
        isPublic: false,
      },
    ],
  },
};
