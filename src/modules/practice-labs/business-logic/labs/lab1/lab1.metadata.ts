// src/modules/practice-labs/business-logic/labs/lab1/lab1.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const blvulnLab1Metadata: LabMetadata = {
  slug: 'blvuln-price-manipulation-checkout',
  title: 'Business Logic: Price Manipulation in Checkout',
  ar_title: 'المنطق التجاري: التلاعب بالسعر في صفحة الدفع',
  description:
    'Exploit a business logic flaw where the product price is sent from the client during checkout without server-side validation, allowing you to purchase expensive items for free or at negative prices.',
  ar_description:
    'استغل خللاً في منطق الأعمال حيث يُرسل سعر المنتج من العميل أثناء الدفع دون التحقق من جانب الخادم، مما يتيح لك شراء سلع باهظة الثمن مجاناً أو بأسعار سلبية.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  skills: [
    'Business Logic',
    'Parameter Tampering',
    'Client-Side Trust',
    'E-Commerce Security',
  ],
  xpReward: 120,
  pointsReward: 60,
  duration: 25,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  // ─── للمتدرب ────────────────────────────────────────────────────
  goal: 'Purchase the "CyberLabs Pro License" (worth $999) for $0 or less by tampering with the price parameter in the checkout request.',
  ar_goal:
    'اشترِ "CyberLabs Pro License" (بقيمة $999) مقابل $0 أو أقل عن طريق التلاعب بمعامل السعر في طلب الدفع.',

  briefing: {
    en: `ShopVault is an online store selling cybersecurity tools and software licenses.
You've been eyeing the CyberLabs Pro License — $999. Way out of budget.
You add it to your cart. Click checkout. The page loads.
Your browser sends a request to the server.
You open Burp Suite and intercept it out of curiosity.
There it is in the request body: productId, quantity... and price.
The price. In the request. The one your browser sends.
Why would the server trust the browser to tell it what something costs?`,
    ar: `ShopVault هو متجر إلكتروني يبيع أدوات الأمن السيبراني والتراخيص البرمجية.
كنت تتطلع إلى CyberLabs Pro License — $999. أبعد بكثير من ميزانيتك.
أضفته إلى عربة التسوق. ضغطت على الدفع. تحمّلت الصفحة.
أرسل متصفحك طلباً إلى الخادم.
فتحت Burp Suite واعترضته من باب الفضول.
هناك في جسم الطلب: productId، quantity... والسعر.
السعر. في الطلب. الذي يرسله متصفحك.
لماذا يثق الخادم بالمتصفح في إخباره بتكلفة شيء ما؟`,
  },

  stepsOverview: {
    en: [
      'Add the product to cart and proceed to checkout normally',
      'Intercept the checkout request and inspect the request body fields',
      'Identify the client-supplied price field and understand why it is a problem',
      'Modify the price value and observe whether the server validates it against the real product price',
    ],
    ar: [
      'أضف المنتج إلى العربة وانتقل للدفع بشكل طبيعي',
      'اعترض طلب الدفع وافحص حقول جسم الطلب',
      'حدد حقل السعر المُرسَل من العميل وافهم لماذا يُشكّل مشكلة',
      'عدّل قيمة السعر ولاحظ هل يتحقق الخادم منه مقابل السعر الحقيقي للمنتج',
    ],
  },

  // ─── للأدمن فقط ─────────────────────────────────────────────────
  solution: {
    context:
      'ShopVault checkout handler reads the price directly from the request body and uses it to calculate the order total, without cross-referencing the actual product price stored in the database. The server trusts whatever price the client sends.',
    vulnerableCode:
      '// Backend checkout handler (vulnerable):\n' +
      'const { productId, quantity, price } = req.body;\n' +
      '// ❌ Trusts client-supplied price instead of fetching from DB\n' +
      'const total = price * quantity;\n' +
      'await db.createOrder({ productId, quantity, total });\n' +
      'res.json({ success: true, charged: total });',
    exploitation:
      'Send POST /checkout with { "productId": "CYBER-PRO-999", "quantity": 1, "price": 0 }. The server calculates total = 0 * 1 = $0 and completes the order. Negative prices also work and may credit your account.',
    steps: {
      en: [
        'Add "CyberLabs Pro License" to cart and click Checkout — observe the normal $999 price',
        'Intercept the POST /checkout request in Burp Suite',
        'In the request body, find the "price" field — it is set to 999',
        'Modify "price" to 0 and forward the request',
        'Server responds with: { success: true, charged: 0 } → order created at $0 → flag appears in the receipt',
      ],
      ar: [
        'أضف "CyberLabs Pro License" للعربة واضغط Checkout — لاحظ السعر الطبيعي $999',
        'اعترض طلب POST /checkout في Burp Suite',
        'في جسم الطلب، ابحث عن حقل "price" — قيمته 999',
        'عدّل "price" إلى 0 وأعد توجيه الطلب',
        'يستجيب الخادم بـ: { success: true, charged: 0 } → يُنشأ الطلب بـ $0 → يظهر العلم في الإيصال',
      ],
    },
    fix: [
      'NEVER accept price from the client — always fetch it server-side: const product = await db.products.findById(productId); const total = product.price * quantity;',
      'Treat all client-supplied financial values as untrusted and ignore them',
      'Add server-side price validation: if (req.body.price !== product.realPrice) return 400',
      'Audit every checkout/payment flow — price, discount, tax must be calculated server-side only',
    ],
  },

  postSolve: {
    explanation: {
      en: "Price Manipulation is a classic Business Logic vulnerability where the server trusts the client to supply the price of an item rather than looking it up server-side. Since the client controls the request body, any value — including $0 or negative numbers — will be accepted and processed. This is not a code bug in the traditional sense; it is a fundamental design flaw in the application's trust model.",
      ar: 'التلاعب بالسعر هو ثغرة كلاسيكية في منطق الأعمال حيث يثق الخادم بالعميل في توفير سعر العنصر بدلاً من البحث عنه من جانب الخادم. نظراً لأن العميل يتحكم في جسم الطلب، فإن أي قيمة — بما في ذلك $0 أو الأرقام السالبة — ستُقبَل وتُعالَج. هذه ليست خطأ برمجياً بالمعنى التقليدي؛ إنها خلل أساسي في نموذج الثقة في التطبيق.',
    },
    impact: {
      en: 'Complete financial loss for the merchant. Attackers can purchase any product for $0 or negative amounts (potentially adding store credit). In real e-commerce systems, this has led to significant financial fraud and forced emergency platform shutdowns.',
      ar: 'خسارة مالية كاملة للتاجر. يمكن للمهاجمين شراء أي منتج مقابل $0 أو مبالغ سالبة (مما قد يضيف رصيداً للمتجر). في أنظمة التجارة الإلكترونية الحقيقية، أدى هذا إلى احتيال مالي كبير وإيقاف طارئ للمنصة.',
    },
    fix: [
      'Golden rule: all financial calculations happen on the server using DB-sourced prices',
      'Never pass price, discount, or tax in client requests — derive them server-side',
      'Add integration tests: attempt checkout with modified price → must return 400',
      'Monitor orders with unusually low totals as a fraud detection signal',
    ],
  },

  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        'Intercept the checkout request. Notice the "price" field in the request body — it is being sent from your browser. Should the client be the one deciding what a product costs?',
    },
    {
      order: 2,
      xpCost: 20,
      content:
        'Try changing the price field to 0 and forward the request. Does the server reject it or process the order at $0?',
    },
    {
      order: 3,
      xpCost: 35,
      content:
        'Try price: -999. A negative price might even add credits to your account balance. The server does not validate against the real product price.',
    },
  ],

  flagAnswer: 'FLAG{BL_PRICE_MANIPULATION_CLIENT_TRUST_PWNED}',
  initialState: {
    contents: [
      {
        title: 'CYBER-PRO-999',
        body: JSON.stringify({
          name: 'CyberLabs Pro License',
          realPrice: 999,
          description: 'Full access to all premium labs and courses',
          stock: 50,
        }),
        author: 'store',
        isPublic: true,
      },
      {
        title: 'BASIC-FREE-001',
        body: JSON.stringify({
          name: 'CyberLabs Free Tier',
          realPrice: 0,
          description: 'Access to basic labs only',
          stock: 999,
        }),
        author: 'store',
        isPublic: true,
      },
    ],
  },
};
