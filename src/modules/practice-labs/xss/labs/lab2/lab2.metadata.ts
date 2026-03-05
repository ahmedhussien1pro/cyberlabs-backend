// src/modules/practice-labs/xss/labs/lab2/lab2.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const xssLab2Metadata: LabMetadata = {
  slug: 'xss-review-moderation-stored',
  title: 'XSS: Review Moderation Poison',
  ar_title: 'XSS المخزّن: تسميم لوحة مراجعات المنتجات',
  description:
    'Submit a malicious product review that will execute JavaScript when the admin opens the Review Moderation Dashboard.',
  ar_description:
    'أرسل تقييم منتج خبيث يُنفَّذ كـ JavaScript عندما يفتح المشرف لوحة مراجعة التقييمات.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'Stored XSS',
    'Privilege Escalation via XSS',
    'Session Hijacking Simulation',
  ],
  xpReward: 200,
  pointsReward: 100,
  duration: 35,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  goal: 'Store an XSS payload in a product review. Then trigger the "Admin Moderate Reviews" action to simulate the admin\'s browser executing your script and leaking their session token.',
  scenario: {
    context:
      'TechMart is a B2B electronics marketplace. Registered users can leave reviews on products. An admin periodically visits the Moderation Dashboard to approve/reject reviews. The dashboard renders review content as raw HTML for "rich formatting support." Your goal is to plant a payload that fires when the admin loads their dashboard.',
    vulnerableCode: `// Admin dashboard renders reviews without sanitization:
reviews.forEach(review => {
  container.innerHTML += \`<div class="review">\${review.content}</div>\`;
});`,
    exploitation:
      "Submit a review containing an HTML payload with an event handler. When the admin loads the moderation dashboard, the browser will render your review content as HTML, executing the injected script in the admin's session context.",
  },
  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'First, submit a normal review and see how it appears. Now try submitting a review with HTML like <b>Bold Text</b> — if it renders as bold, the content is not sanitized.',
    },
    {
      order: 2,
      xpCost: 25,
      content:
        "The goal is to execute JavaScript in the ADMIN's browser, not your own. You need to store a payload and then simulate the admin viewing it.",
    },
    {
      order: 3,
      xpCost: 40,
      content:
        'Use an img onerror payload in your review text. After submitting, click "Simulate Admin View" — this endpoint simulates the admin loading the dashboard with your stored payload.',
    },
    {
      order: 4,
      xpCost: 60,
      content:
        'Payload: Submit review with content <img src=x onerror="alert(document.cookie)"> then use the "Admin View" endpoint. The system will detect the XSS execution and reveal the flag.',
    },
  ],

  flagAnswer: 'FLAG{XSS_STORED_ADMIN_SESSION_HIJACKED_772}',
  initialState: {
    users: [
      {
        username: 'admin_moderator',
        password: 'Tr0ub4dor&3_secure!',
        role: 'ADMIN',
      },
      { username: 'buyer_alice', password: 'alice_buyer_123', role: 'USER' },
    ],
    contents: [
      {
        title: 'UltraHub USB-C 7-in-1 Dock',
        body: 'product',
        meta: {
          productId: 'techmart-dock-07',
          price: 89.99,
          category: 'Accessories',
          rating: 4.5,
        },
      },
    ],
    logs: [
      {
        action: 'REVIEW',
        meta: {
          productId: 'techmart-dock-07',
          author: 'verified_buyer_99',
          content:
            'Excellent build quality! Works perfectly with my MacBook Pro.',
          rating: 5,
          status: 'pending',
        },
      },
    ],
  },
};
