export const Lab3Config = {
  labSlug: 'broken-auth-lab3',
  description: 'Broken Authentication - Weak JWT secret and token manipulation',

  initialState: {
    users: [
      {
        username: 'user',
        email: 'user@jwt.com',
        role: 'USER',
        password: 'user123',
      },
      {
        username: 'admin',
        email: 'admin@jwt.com',
        role: 'ADMIN',
        password: 'admin999',
      },
    ],
  },

  objective: 'Crack weak JWT secret or manipulate token to gain admin access',
  flagCondition: 'jwt_exploited',
  weakSecret: 'secret', // ❌ Weak JWT secret!
};
