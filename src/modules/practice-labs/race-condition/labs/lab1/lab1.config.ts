export const Lab1Config = {
  labSlug: 'race-condition-lab1',
  description: 'Race Condition - Double spending attack on bank transfers',

  initialState: {
    users: [
      {
        username: 'attacker',
        email: 'attacker@bank.com',
        role: 'USER',
        password: 'pass123',
      },
      {
        username: 'merchant',
        email: 'merchant@bank.com',
        role: 'USER',
        password: 'pass456',
      },
    ],
    banks: [
      { accountNo: 'ATK001', balance: 100 }, // Attacker account with low balance
      { accountNo: 'MER001', balance: 0 }, // Merchant account
    ],
  },

  objective:
    'Exploit race condition to spend more money than you have (balance >= 500 in merchant account)',
  flagCondition: 'merchant_balance >= 500',
};
