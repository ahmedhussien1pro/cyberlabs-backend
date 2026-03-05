// src/modules/practice-labs/bl-vuln/labs/lab1/lab1.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const blvulnLab1Metadata: LabMetadata = {
  slug: 'blvuln-price-manipulation-checkout',
  title: 'Business Logic: Price Manipulation in Checkout',
  ar_title: 'المنطق التجاري: التلاعب بالسعر في صفحة الدفع',
  description:
    'Exploit a business logic flaw where the product price is sent from the client during checkout without server-side validation, allowing you to purchase expensive items for free or negative prices.',
  ar_description:
    'استغل خللًا في منطق الأعمال حيث يُرسل سعر المنتج من العميل أثناء الدفع دون التحقق من جانب الخادم، مما يتيح لك شراء سلع باهظة الثمن مجانًا أو بأسعار سلبية.',
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
  goal: 'Purchase the "CyberLabs Pro License" (worth $999) for $0 or less by tampering with the price parameter in the checkout request.',
  scenario: {
    context:
      'ShopVault is an online store selling cybersecurity tools and licenses. When a user adds a product to cart and proceeds to checkout, the frontend sends the price in the request body. The backend trusts this price without cross-referencing the actual product price from the database.',
    vulnerableCode: `// Backend checkout handler (vulnerable):
const { productId, quantity, price } = req.body;
// ❌ Trusts client-supplied price instead of fetching from DB
const total = price * quantity;
await db.createOrder({ productId, quantity, total });
res.json({ success: true, charged: total });`,
    exploitation:
      'Send a checkout request with price: 0 or price: -999. The backend calculates total from your supplied price, charges $0, and completes the order — giving you a $999 license for free.',
  },
  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        'Intercept the checkout request. Notice the "price" field in the request body. This should come from the server, not the client.',
    },
    {
      order: 2,
      xpCost: 20,
      content: 'Try changing price to 0. Does the order go through?',
    },
    {
      order: 3,
      xpCost: 35,
      content:
        'Try price: -999. A negative price might even add credits to your account!',
    },
    {
      order: 4,
      xpCost: 50,
      content:
        'POST /checkout with body: { "productId": "CYBER-PRO-999", "quantity": 1, "price": 0 }. The order will complete and the flag appears in the receipt.',
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
