export const Lab2Config = {
  labSlug: 'broken-auth-lab2',
  description:
    'Broken Authentication - Session fixation and hijacking vulnerabilities',

  initialState: {
    users: [
      {
        username: 'victim',
        email: 'victim@test.com',
        role: 'USER',
        password: 'victim123',
      },
      {
        username: 'attacker',
        email: 'attacker@test.com',
        role: 'USER',
        password: 'attack456',
      },
    ],
  },

  objective: 'Hijack victim session using session fixation',
  flagCondition: 'session_hijacked',
};
