export const Lab3Config = {
  labSlug: 'jwt-lab3',
  description:
    'JWT Algorithm Confusion - Change RS256 to HS256 to bypass verification',

  initialState: {
    users: [
      {
        username: 'user',
        email: 'user@test.com',
        role: 'USER',
        password: 'user123',
      },
      {
        username: 'superadmin',
        email: 'superadmin@test.com',
        role: 'SUPERADMIN',
        password: 'impossible',
      },
    ],
  },

  objective: 'Exploit algorithm confusion to get superadmin access',
  flagCondition: 'algorithm_confusion_exploited',
};
