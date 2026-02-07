export const Lab1Config = {
  labSlug: 'idor-lab1',
  description: 'Banking IDOR - Transfer money vulnerability',

  initialState: {
    users: [
      { username: 'victim', email: 'victim@bank.com', role: 'USER' },
      { username: 'attacker', email: 'attacker@bank.com', role: 'USER' },
    ],
    banks: [
      { accountNo: 'ACC001', balance: 5000 }, // ✅ الاسم الصحيح
      { accountNo: 'ACC002', balance: 100 }, // ✅ الاسم الصحيح
    ],
  },

  objective: 'Transfer money from victim account (ACC001) to your account',
  flagCondition: 'attacker_balance >= 1000',
};
