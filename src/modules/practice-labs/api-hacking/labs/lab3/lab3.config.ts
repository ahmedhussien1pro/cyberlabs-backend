export const Lab3Config = {
  labSlug: 'api-hacking-lab3',
  description: 'API Security - Rate limiting bypass and brute force attacks',

  initialState: {
    users: [
      {
        username: 'target',
        email: 'target@api.com',
        role: 'USER',
        password: 'pass1234',
      },
    ],
  },

  objective:
    'Bypass rate limiting to brute force login (password is "pass1234")',
  flagCondition: 'rate_limit_bypassed',
  maxAttempts: 3, // Weak rate limit
};
