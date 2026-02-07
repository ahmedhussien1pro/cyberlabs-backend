export const Lab2Config = {
  labSlug: 'sqli-lab2',
  description:
    'SQL Injection - Extract sensitive data using UNION-based injection',

  initialState: {
    users: [
      {
        username: 'alice',
        email: 'alice@company.com',
        role: 'USER',
        password: 'alice123',
      },
      {
        username: 'bob',
        email: 'bob@company.com',
        role: 'USER',
        password: 'bob456',
      },
      {
        username: 'admin',
        email: 'admin@company.com',
        role: 'ADMIN',
        password: 'FLAG{SQLI_UNION_DATA_EXTRACTED}',
      },
    ],
  },

  objective: 'Extract admin password using UNION-based SQL injection',
  flagCondition: 'admin_password_extracted',
};
