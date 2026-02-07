export const Lab1Config = {
  labSlug: 'csrf-lab1',
  description: 'CSRF - Execute unauthorized actions without CSRF protection',

  initialState: {
    users: [
      {
        username: 'victim',
        email: 'victim@bank.com',
        role: 'USER',
        password: 'victim123',
      },
    ],
    banks: [{ accountNo: 'ACC-VICTIM', balance: 1000 }],
  },

  objective: 'Transfer money from victim account using CSRF attack',
  flagCondition: 'csrf_exploited',
};
