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

  goal: 'Access the /admin/users endpoint (normally restricted to admin role) by injecting a crafted X-User-Role header to escalate your privileges from "customer" to "admin".',
  scenario: {
    context:
      'You are logged into TechStore as a regular customer. The store has an admin dashboard at /admin/users that lists all user accounts and their order history. The backend uses a custom header X-User-Role (intended for internal microservice communication) to determine access level. A misconfiguration allows external clients to set this header.',
    vulnerableCode: `// Backend authorization check (vulnerable):
const userRole = req.headers['x-user-role'] || 'customer';
// ❌ Trusting client-supplied header instead of JWT payload
if (userRole !== 'admin') {
  return res.status(403).json({ error: 'Forbidden' });
}
// Admin logic proceeds...`,
    exploitation:
      "The backend reads the X-User-Role header directly from the request without verifying it against the authenticated user's actual role in the JWT token. By adding X-User-Role: admin to your request headers, you can bypass the authorization check and access admin-only endpoints.",
  },
  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'Try accessing GET /admin/users as a regular customer. You get 403 Forbidden. The error message says: "Admin role required." How does the backend know your role?',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'Inspect your current request headers. You might notice X-User-Role: customer being sent. This is suspicious — why would the client tell the server its own role?',
    },
    {
      order: 3,
      xpCost: 50,
      content:
        'Try modifying the X-User-Role header to admin. Send: GET /admin/users with header X-User-Role: admin.',
    },
    {
      order: 4,
      xpCost: 75,
      content:
        'Full exploit: Send GET /admin/users with X-User-Role: admin. The response will include the admin user list and the flag embedded in the admin account details.',
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
