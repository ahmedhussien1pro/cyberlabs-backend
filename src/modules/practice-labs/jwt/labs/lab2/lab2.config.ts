export const Lab2Config = {
  labSlug: 'jwt-lab2',
  description: 'JWT Weak Secret - Brute force JWT secret to forge admin token',

  initialState: {
    users: [
      {
        username: 'guest',
        email: 'guest@test.com',
        role: 'GUEST',
        password: 'guest',
      },
      {
        username: 'admin',
        email: 'admin@test.com',
        role: 'ADMIN',
        password: 'unknown',
      },
    ],
  },

  objective:
    'Crack the weak JWT secret (hint: common password) and forge admin token',
  flagCondition: 'forged_admin_token',
};
