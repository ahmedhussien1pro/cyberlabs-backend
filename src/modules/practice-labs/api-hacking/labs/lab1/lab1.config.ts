export const Lab1Config = {
  labSlug: 'api-hacking-lab1',
  description:
    'API Security - Broken Object Level Authorization (BOLA/IDOR in APIs)',

  initialState: {
    users: [
      {
        username: 'user1',
        email: 'user1@api.com',
        role: 'USER',
        password: 'pass1',
      },
      {
        username: 'user2',
        email: 'user2@api.com',
        role: 'USER',
        password: 'pass2',
      },
      {
        username: 'premium',
        email: 'premium@api.com',
        role: 'PREMIUM',
        password: 'premium123',
      },
    ],
    contents: [
      {
        title: 'User1 Document',
        body: 'User1 private data',
        author: 'user1',
        isPublic: false,
      },
      {
        title: 'User2 Document',
        body: 'User2 private data',
        author: 'user2',
        isPublic: false,
      },
      {
        title: 'Premium Document',
        body: 'FLAG{API_BOLA_EXPLOITED}',
        author: 'premium',
        isPublic: false,
      },
    ],
  },

  objective: 'Access premium user documents through BOLA vulnerability in API',
  flagCondition: 'bola_exploited',
};
