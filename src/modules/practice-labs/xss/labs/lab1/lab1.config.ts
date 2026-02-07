export const Lab1Config = {
  labSlug: 'xss-lab1',
  description: 'XSS - Reflected XSS vulnerability in search functionality',

  initialState: {
    users: [
      {
        username: 'victim',
        email: 'victim@test.com',
        role: 'USER',
        password: 'victim123',
      },
    ],
    contents: [
      { title: 'Post 1', body: 'Content 1', author: 'victim', isPublic: true },
      { title: 'Post 2', body: 'Content 2', author: 'victim', isPublic: true },
    ],
  },

  objective: 'Execute JavaScript using reflected XSS to steal cookie/session',
  flagCondition: 'xss_reflected_executed',
};
