export const Lab3Config = {
  labSlug: 'sqli-lab3',
  description: 'SQL Injection - Boolean-based blind SQL injection',

  initialState: {
    users: [
      {
        username: 'user1',
        email: 'user1@test.com',
        role: 'USER',
        password: 'pass1',
      },
      {
        username: 'secret_admin',
        email: 'secret@test.com',
        role: 'ADMIN',
        password: 'SECRET',
      },
    ],
  },

  objective:
    'Extract admin username using blind SQL injection (hint: starts with "secret")',
  flagCondition: 'blind_sqli_success',
};
