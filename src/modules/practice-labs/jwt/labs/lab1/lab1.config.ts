export const Lab1Config = {
  labSlug: 'jwt-lab1',
  description:
    'JWT None Algorithm Vulnerability - Bypass authentication using "none" algorithm',

  initialState: {
    users: [
      {
        username: 'user',
        email: 'user@test.com',
        role: 'USER',
        password: 'user123',
      },
      {
        username: 'admin',
        email: 'admin@test.com',
        role: 'ADMIN',
        password: 'supersecret',
      },
    ],
  },

  objective: 'Get admin access by exploiting JWT none algorithm vulnerability',
  flagCondition: 'admin_access_granted',
};
