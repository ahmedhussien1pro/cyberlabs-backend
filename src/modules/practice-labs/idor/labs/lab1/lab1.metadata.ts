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
  goal: 'Your order is ORD-1001. Enumerate order IDs to find the VIP classified shipment (ORD-10XX) and access its confidential delivery details to retrieve the flag.',
  scenario: {
    context:
      'TrackShip is a logistics platform. When you log in, you can track your shipments via /orders/{orderId}. Order IDs are sequential integers prefixed with ORD-. The endpoint returns full shipment details without checking whether the order belongs to the requesting user.',
    vulnerableCode: `// Order tracking endpoint (vulnerable):
app.get('/orders/:orderId', async (req, res) => {
  const order = await db.orders.findOne({ id: req.params.orderId });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  // ❌ No ownership check: order.userId !== req.user.id
  res.json(order);
});`,
    exploitation:
      'Change the orderId in the request from ORD-1001 to ORD-1002, ORD-1003, etc. One of these IDs belongs to a VIP classified shipment with confidential cargo details.',
  },
  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        "Your order ID is ORD-1001. What happens if you request ORD-1002? Does the server check if it's your order?",
    },
    {
      order: 2,
      xpCost: 20,
      content:
        "Order IDs are sequential. Try ORD-1001 through ORD-1010. Look for an order that doesn't belong to you.",
    },
    {
      order: 3,
      xpCost: 35,
      content:
        'POST /orders/track with { "orderId": "ORD-1005" }. The response should return another user\'s shipment. Find the VIP shipment.',
    },
    {
      order: 4,
      xpCost: 50,
      content:
        'The VIP classified shipment is at ORD-1007. Access it to find the flag in the cargo details.',
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
