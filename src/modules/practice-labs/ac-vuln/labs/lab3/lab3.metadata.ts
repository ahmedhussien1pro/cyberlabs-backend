// src/modules/practice-labs/ac-vuln/labs/lab3/lab3.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const acvulnLab3Metadata: LabMetadata = {
  slug: 'acvuln-horizontal-privesc-banking',
  title: 'Horizontal Privilege Escalation: Banking Account Tampering',
  ar_title: 'تصعيد الصلاحيات الأفقي: التلاعب بحسابات البنك',
  description:
    "Exploit a horizontal privilege escalation vulnerability in a banking portal by tampering with the accountNo parameter to access other customers' account balances and transaction history.",
  ar_description:
    'استغل ثغرة تصعيد الصلاحيات الأفقي في بوابة بنكية عن طريق التلاعب بمعامل accountNo للوصول إلى أرصدة وسجلات معاملات عملاء آخرين.',
  difficulty: 'INTERMEDIATE',
  category: 'WEB_SECURITY',
  skills: [
    'Horizontal Privilege Escalation',
    'IDOR',
    'Parameter Tampering',
    'Financial Data Access',
  ],
  xpReward: 240,
  pointsReward: 120,
  duration: 45,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,

  goal: 'Access the account balance and transaction history of the VIP customer "Amelia Rodriguez" (accountNo: VIP-9876-2026) to find the flag hidden in her latest high-value transaction memo.',
  scenario: {
    context:
      'You are logged into SecureBank Online as customer "Bob Smith" (accountNo: ACC-1234-5678). You can view your own balance and transactions via POST /api/account/balance with body: { "accountNo": "ACC-1234-5678" }. The backend fetches the account data based on the accountNo in the request body, without verifying ownership.',
    vulnerableCode: `// Backend account balance fetch (vulnerable):
const { accountNo } = req.body;
const account = await db.accounts.findOne({ accountNo });
// ❌ No check: does accountNo belong to authenticated user?
res.json({ balance: account.balance, owner: account.ownerName });`,
    exploitation:
      'The accountNo is provided in the request body and trusted blindly. By changing it to another customer\'s account number, you can retrieve their balance and transaction history. This is horizontal privilege escalation — you remain a "customer" role, but access data belonging to other customers of the same role.',
  },
  hints: [
    {
      order: 1,
      xpCost: 15,
      content:
        'Check your own account balance. The request body includes your accountNo. What if you change this to a different account number?',
    },
    {
      order: 2,
      xpCost: 30,
      content:
        'Try sequential account numbers: ACC-1234-5679, ACC-1234-5680. Some will return "Account not found," but others might return valid data.',
    },
    {
      order: 3,
      xpCost: 45,
      content:
        'The target is a VIP customer named Amelia Rodriguez. VIP accounts use a different format: VIP-XXXX-YYYY. Try VIP-9876-2026.',
    },
    {
      order: 4,
      xpCost: 70,
      content:
        'Request: POST /account/balance with body { "accountNo": "VIP-9876-2026" }. Then request POST /account/transactions with the same accountNo. The flag is in the memo field of the latest transaction.',
    },
  ],

  flagAnswer: 'FLAG{HORIZONTAL_PRIVESC_BANK_IDOR_VIP_ACC}',
  initialState: {
    users: [
      { username: 'bob_smith', password: 'bobpass123', role: 'customer' },
      {
        username: 'amelia_rodriguez',
        password: 'ameliaVIP!2026',
        role: 'customer',
      },
    ],
    banks: [
      { accountNo: 'ACC-1234-5678', balance: 5420.75, ownerName: 'Bob Smith' },
      {
        accountNo: 'VIP-9876-2026',
        balance: 1250000.0,
        ownerName: 'Amelia Rodriguez',
      },
    ],
    logs: [
      {
        action: 'TRANSACTION',
        meta: {
          accountNo: 'VIP-9876-2026',
          type: 'wire_transfer_in',
          amount: 500000,
          memo: 'Confidential: FLAG{HORIZONTAL_PRIVESC_BANK_IDOR_VIP_ACC} — Annual bonus deposit',
          timestamp: '2026-03-01T14:22:00Z',
        },
      },
    ],
  },
};
