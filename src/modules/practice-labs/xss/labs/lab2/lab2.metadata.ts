export const Lab2Config = {
  labSlug: 'xss-lab2',
  description: 'XSS - Stored XSS in comment system (persistent attack)',

  initialState: {
    users: [
      {
        username: 'attacker',
        email: 'attacker@test.com',
        role: 'USER',
        password: 'attack123',
      },
      {
        username: 'victim',
        email: 'victim@test.com',
        role: 'USER',
        password: 'victim123',
      },
    ],
    contents: [
      {
        title: 'Blog Post',
        body: 'Welcome to my blog!',
        author: 'victim',
        isPublic: true,
      },
    ],
  },

  objective:
    'Store malicious JavaScript in comments that executes for all viewers',
  flagCondition: 'stored_xss_persisted',
};
