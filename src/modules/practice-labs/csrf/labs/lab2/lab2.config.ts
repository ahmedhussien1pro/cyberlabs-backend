export const Lab2Config = {
  labSlug: 'csrf-lab2',
  description: 'CSRF - Bypass weak CSRF token validation',

  initialState: {
    users: [
      {
        username: 'user',
        email: 'user@site.com',
        role: 'USER',
        password: 'user123',
      },
    ],
  },

  objective: 'Bypass CSRF protection using weak token validation',
  flagCondition: 'csrf_bypass_success',
};
