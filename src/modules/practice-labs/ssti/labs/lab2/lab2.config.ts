export const Lab2Config = {
  labSlug: 'ssti-lab2',
  description: 'SSTI - Escalate template injection to Remote Code Execution',

  initialState: {
    users: [
      {
        username: 'developer',
        email: 'dev@company.com',
        role: 'USER',
        password: 'dev123',
      },
    ],
  },

  objective: 'Execute code on server using SSTI to get the flag',
  flagCondition: 'rce_achieved',
};
