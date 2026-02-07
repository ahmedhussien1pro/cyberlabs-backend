export const Lab3Config = {
  labSlug: 'ssti-lab3',
  description: 'SSTI - Bypass weak filters to achieve template injection',

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

  objective: 'Bypass input filters to inject template and access secret',
  flagCondition: 'filter_bypass_success',
  blockedKeywords: ['{{', '}}', 'eval', 'exec'],
};
