export const Lab3Config = {
  labSlug: 'csrf-lab3',
  description: 'CSRF - Exploit GET-based state-changing operations',

  initialState: {
    users: [
      {
        username: 'victim',
        email: 'victim@app.com',
        role: 'USER',
        password: 'victim123',
      },
      {
        username: 'admin',
        email: 'admin@app.com',
        role: 'ADMIN',
        password: 'admin999',
      },
    ],
  },

  objective: 'Exploit GET-based CSRF to promote user to admin',
  flagCondition: 'get_csrf_exploited',
};
