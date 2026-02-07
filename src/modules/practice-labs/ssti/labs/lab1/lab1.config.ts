export const Lab1Config = {
  labSlug: 'ssti-lab1',
  description: 'SSTI - Basic template injection to read sensitive data',

  initialState: {
    users: [
      {
        username: 'user',
        email: 'user@test.com',
        role: 'USER',
        password: 'user123',
      },
    ],
    contents: [
      {
        title: 'Welcome Template',
        body: 'Hello {{username}}!',
        author: 'system',
        isPublic: true,
      },
      {
        title: 'Secret Flag',
        body: 'FLAG{SSTI_TEMPLATE_INJECTION_BASIC}',
        author: 'admin',
        isPublic: false,
      },
    ],
  },

  objective: 'Use template injection to access hidden flag',
  flagCondition: 'template_injection_success',
};
