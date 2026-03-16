// src/modules/practice-labs/idor/labs/lab1/lab1.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const idorLab1Metadata: LabMetadata = {
  slug: 'idor-order-tracking-delivery',
  canonicalConceptId: 'idor-sequential-id-enumeration',
  environmentType: 'GENERIC',
  title: 'IDOR: Order Tracking — Shipment Details Leak',
  ar_title: 'IDOR: تتبع الطلبات — تسريب تفاصيل الشحنة',
  description:
    "Exploit an IDOR vulnerability in a delivery platform where shipment order IDs are sequential and predictable. Access other users' shipment details including a VIP classified shipment to retrieve the flag.",
  ar_description:
    'استغل ثغرة IDOR في منصة توصيل حيث معرفات طلبات الشحن تسلسلية ويمكن التنبؤ بها.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  skills: ['IDOR', 'Object Reference Manipulation', 'Sequential ID Enumeration', 'Information Disclosure'],
  xpReward: 120,
  pointsReward: 60,
  duration: 25,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  missionBrief: {
    codename: 'OPERATION GHOST CARGO',
    classification: 'CONFIDENTIAL',
    objective: 'Infiltrate TrackShip logistics platform. Enumerate sequential order IDs to locate a classified government shipment.',
    ar_objective: 'تسلل إلى منصة TrackShip اللوجستية. عدّد معرفات الطلبات التسلسلية.',
    successCriteria: ['Retrieve the flag embedded in the classified VIP shipment cargo field.'],
    ar_successCriteria: ['استرجع العلم المضمَّن في حقل شحنة VIP السرية.'],
  },
  labInfo: {
    vulnType: 'IDOR (Insecure Direct Object Reference)',
    cweId: 'CWE-639',
    cvssScore: 7.5,
    whatYouLearn: [
      'How IDOR arises from missing object-level authorization checks',
      'Why sequential integer IDs are dangerous and easy to enumerate',
    ],
    ar_whatYouLearn: [
      'كيف ينشأ IDOR من غياب فحوصات التفويض على مستوى الكائن',
      'لماذا المعرفات الصحيحة التسلسلية خطيرة وسهلة التعداد',
    ],
    techStack: ['REST API', 'Node.js', 'Sequential IDs'],
    references: [
      { label: 'OWASP IDOR Guide', url: 'https://owasp.org/www-chapter-ghana/assets/slides/IDOR.pdf' },
      { label: 'OWASP Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html' },
      { label: 'CWE-639', url: 'https://cwe.mitre.org/data/definitions/639.html' },
    ],
  },
  goal: 'Your order is ORD-1001. Enumerate order IDs to find the VIP classified shipment and retrieve the flag.',
  ar_goal: 'طلبك هو ORD-1001. عدّد معرفات الطلبات للعثور على الشحنة السرية واسترداد العلم.',
  briefing: {
    en: `TrackShip — a logistics platform. You are john_doe. Your order: ORD-1001. You try /orders/ORD-1002 — the server returns it without checking ownership. Something classified is in here.`,
    ar: `TrackShip — منصة لوجستية. أنت john_doe. طلبك: ORD-1001. تحاول /orders/ORD-1002 — الخادم يعيده دون التحقق من الملكية. شيء مُصنَّف موجود هنا.`,
  },
  stepsOverview: {
    en: [
      'Request GET /orders/ORD-1001 — your own order',
      "Try GET /orders/ORD-1002 — another user's order, confirm no ownership check",
      'Enumerate ORD-1001 through ORD-1010 sequentially',
      'Identify the VIP/CLASSIFIED order with a flag',
    ],
    ar: [
      'اطلب GET /orders/ORD-1001 — طلبك الخاص',
      'جرّب GET /orders/ORD-1002 — أكّد غياب التحقق من الملكية',
      'عدّد من ORD-1001 إلى ORD-1010',
      'حدد الطلب VIP/CLASSIFIED الذي يحتوي على علم',
    ],
  },
  solution: {
    context: 'TrackShip order endpoint fetches order by ID without verifying order.userId === req.user.id.',
    vulnerableCode: `app.get('/orders/:orderId', async (req, res) => {
  const order = await db.orders.findOne({ id: req.params.orderId });
  // ❌ No ownership check
  res.json(order);
});`,
    exploitation: 'GET /orders/ORD-1007 — returns VIP shipment with flag in cargo field.',
    steps: {
      en: [
        'GET /orders/ORD-1001 → your order confirmed',
        'GET /orders/ORD-1002 → another user\'s order returned → IDOR confirmed',
        'Enumerate to ORD-1007 → classification: TOP SECRET → flag captured',
      ],
      ar: [
        'GET /orders/ORD-1001 → طلبك مؤكَّد',
        'GET /orders/ORD-1002 → طلب مستخدم آخر مُعاد → تم تأكيد IDOR',
        'عدّد إلى ORD-1007 → classification: TOP SECRET → تم الحصول على الفلاج',
      ],
    },
    fix: [
      'Always verify ownership: if (order.userId !== req.user.id) return 403 Forbidden',
      'Use GUIDs/UUIDs instead of sequential integers',
      'Apply object-level authorization checks at every endpoint',
    ],
  },
  postSolve: {
    explanation: {
      en: 'IDOR occurs when an application uses user-controllable input to access objects directly without authorization checks. Sequential integer IDs make enumeration trivial.',
      ar: 'يحدث IDOR عندما يستخدم التطبيق مدخلات يتحكم فيها المستخدم للوصول إلى الكائنات مباشرة بدون فحوصات تفويض.',
    },
    impact: {
      en: 'Full data breach across all user records. In logistics: shipment routes, cargo contents, recipient addresses exposed.',
      ar: 'خرق بيانات كامل عبر جميع سجلات المستخدمين.',
    },
    fix: [
      'Object-level authorization: EVERY data retrieval must verify ownership',
      'Non-sequential IDs: use UUIDs',
      'Centralized authorization middleware',
    ],
  },
  hints: [
    { order: 1, xpCost: 10, content: "Your order ID is ORD-1001. What happens if you request ORD-1002? Does the server check if it's your order?" },
    { order: 2, xpCost: 20, content: 'Order IDs are sequential. Try ORD-1001 through ORD-1010 one by one.' },
    { order: 3, xpCost: 35, content: 'The VIP classified shipment is between ORD-1005 and ORD-1010. classification: TOP SECRET.' },
  ],
  flagAnswer: 'FLAG{IDOR_ORDER_TRACKING_SEQUENTIAL_ID_ENUMERATION}',
  initialState: {
    contents: [
      { title: 'ORD-1001', body: JSON.stringify({ cargo: 'Electronics', destination: 'Cairo', status: 'In Transit', owner: 'john_doe', isVIP: false }), author: 'shipment', isPublic: false },
      { title: 'ORD-1002', body: JSON.stringify({ cargo: 'Clothing', destination: 'Alex', status: 'Delivered', owner: 'sara_m', isVIP: false }), author: 'shipment', isPublic: false },
      { title: 'ORD-1003', body: JSON.stringify({ cargo: 'Books', destination: 'Giza', status: 'Pending', owner: 'ahmed_k', isVIP: false }), author: 'shipment', isPublic: false },
      { title: 'ORD-1007', body: JSON.stringify({ cargo: 'CLASSIFIED — Government Documents', destination: 'Cairo Intelligence HQ', status: 'RESTRICTED', owner: 'gov_agency_001', isVIP: true, classification: 'TOP SECRET', flag: 'FLAG{IDOR_ORDER_TRACKING_SEQUENTIAL_ID_ENUMERATION}' }), author: 'vip_shipment', isPublic: false },
    ],
  },
};
