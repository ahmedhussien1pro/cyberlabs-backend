export const Lab3Config = {
  labSlug: 'xss-lab3',
  description: 'XSS - DOM-based XSS via URL fragment manipulation',

  initialState: {
    users: [
      {
        username: 'user',
        email: 'user@test.com',
        role: 'USER',
        password: 'user123',
      },
    ],
  },

  objective: 'Exploit DOM-based XSS by manipulating URL parameters',
  flagCondition: 'dom_xss_executed',
};
