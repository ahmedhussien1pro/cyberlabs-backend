// src/modules/practice-labs/bl-vuln/labs/lab4/lab4.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const blvulnLab4Metadata: LabMetadata = {
  slug: 'blvuln-race-condition-double-spend',
  title: 'Business Logic: Race Condition — Double Spend Attack',
  ar_title: 'المنطق التجاري: حالة السباق — هجوم الإنفاق المزدوج',
  description:
    'Exploit a race condition vulnerability in a crypto wallet transfer system by sending concurrent requests to transfer the same funds twice, effectively doubling your balance.',
  ar_description:
    'استغل ثغرة حالة السباق في نظام تحويل المحفظة المشفرة بإرسال طلبات متزامنة لتحويل نفس الأموال مرتين، مما يُضاعف رصيدك فعليًا.',
  difficulty: 'ADVANCED',
  category: 'WEB_SECURITY',
  skills: [
    'Race Condition',
    'Business Logic',
    'Concurrency Exploitation',
    'Double Spend Attack',
  ],
  xpReward: 320,
  pointsReward: 160,
  duration: 55,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: 'Start with $100 balance. Use a race condition attack to send concurrent transfer requests and end up with more than $100 across all accounts (double spend).',
  scenario: {
    context:
      'CryptoVault is a digital wallet platform. You have $100 balance. The transfer API reads your balance, checks if sufficient, then deducts. The flaw: it reads and writes balance in two separate operations without locking, creating a race window where two concurrent requests both see the original $100 and both succeed — resulting in $200 being sent from a $100 account.',
    vulnerableCode: `// Transfer handler (vulnerable):
async function transfer(fromId, toId, amount) {
  const sender = await db.wallets.findOne({ id: fromId });
  // ❌ Race window here — two threads both read balance = 100
  if (sender.balance < amount) throw new Error('Insufficient funds');
  // ❌ Both threads pass the check and both deduct!
  await db.wallets.update({ id: fromId, balance: sender.balance - amount });
  await db.wallets.update({ id: toId, balance: toId.balance + amount });
}`,
    exploitation:
      'Send 2+ concurrent transfer requests of $100 each from your wallet at the exact same time. Both requests read balance = $100, both pass the check, both deduct — you successfully transfer $200 from a $100 account.',
  },
  hints: [
    {
      order: 1,
      xpCost: 20,
      content:
        'Check your balance: $100. Try transferring $100 to Account B. Then try again — it should fail. But what if both requests arrive simultaneously?',
    },
    {
      order: 2,
      xpCost: 35,
      content:
        'Send 2 transfer requests at EXACTLY the same time (parallel requests). Use tools like Burp Suite Turbo Intruder, curl --parallel, or Promise.all() in JavaScript.',
    },
    {
      order: 3,
      xpCost: 55,
      content:
        'POST /wallet/transfer with { "toAccount": "VAULT-B", "amount": 100 } — send this exact request twice simultaneously. Check both account balances after.',
    },
    {
      order: 4,
      xpCost: 80,
      content:
        'If the race works: Account A balance = $0 (deducted twice fails on second) but Account B = $200 OR both accounts have $100 (double credit). Total money in system > $100 = double spend.',
    },
  ],
  flagAnswer: 'FLAG{BL_RACE_CONDITION_DOUBLE_SPEND_CRYPTO_VAULT}',
  initialState: {
    banks: [
      { accountNo: 'VAULT-A', balance: 100, ownerName: 'Attacker Account' },
      { accountNo: 'VAULT-B', balance: 0, ownerName: 'Receiving Account' },
    ],
  },
};
