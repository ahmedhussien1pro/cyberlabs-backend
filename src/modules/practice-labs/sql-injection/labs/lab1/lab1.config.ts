export const Lab1Config = {
  labSlug: 'sqli-lab1',
  description: 'SQL Injection - Bypass authentication using SQL injection',

  initialState: {
    users: [
      {
        username: 'user',
        email: 'user@test.com',
        role: 'USER',
        password: 'userpass',
      },
      {
        username: 'admin',
        email: 'admin@test.com',
        role: 'ADMIN',
        password: 'impossible_to_guess_password_12345',
      },
    ],
  },

  objective: 'Login as admin without knowing the password using SQL injection',
  flagCondition: 'admin_login_success',
};
