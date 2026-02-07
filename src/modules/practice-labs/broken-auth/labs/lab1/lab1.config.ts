export const Lab1Config = {
  labSlug: 'broken-auth-lab1',
  description:
    'Broken Authentication - Exploit weak password policy and brute force',

  initialState: {
    users: [
      {
        username: 'admin',
        email: 'admin@company.com',
        role: 'ADMIN',
        password: '123456',
      }, // Weak password!
      {
        username: 'user',
        email: 'user@company.com',
        role: 'USER',
        password: 'password',
      },
    ],
  },

  objective:
    'Brute force admin account with weak password (hint: try common passwords)',
  flagCondition: 'weak_password_exploited',
};
