export const Lab2Config = {
  labSlug: 'ac-vuln-lab2',
  description:
    'Access Control - Vertical privilege escalation from USER to ADMIN',

  initialState: {
    users: [
      {
        username: 'user',
        email: 'user@test.com',
        role: 'USER',
        password: 'user123',
      },
      {
        username: 'moderator',
        email: 'mod@test.com',
        role: 'MODERATOR',
        password: 'mod456',
      },
      {
        username: 'admin',
        email: 'admin@test.com',
        role: 'ADMIN',
        password: 'admin999',
      },
    ],
  },

  objective: 'Escalate privileges from USER to ADMIN and access admin panel',
  flagCondition: 'vertical_escalation_success',
};
