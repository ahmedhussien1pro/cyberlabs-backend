export const Lab1Config = {
  labSlug: 'ac-vuln-lab1',
  description:
    'Access Control - Horizontal privilege escalation to view other users data',

  initialState: {
    users: [
      {
        username: 'alice',
        email: 'alice@company.com',
        role: 'USER',
        password: 'alice123',
      },
      {
        username: 'bob',
        email: 'bob@company.com',
        role: 'USER',
        password: 'bob456',
      },
      {
        username: 'charlie',
        email: 'charlie@company.com',
        role: 'USER',
        password: 'charlie789',
      },
    ],
    contents: [
      {
        title: 'Alice Secret',
        body: 'Alice private data',
        author: 'alice',
        isPublic: false,
      },
      {
        title: 'Bob Secret',
        body: 'Bob private data',
        author: 'bob',
        isPublic: false,
      },
      {
        title: 'Charlie Secret',
        body: 'FLAG{HORIZONTAL_PRIVILEGE_ESCALATION}',
        author: 'charlie',
        isPublic: false,
      },
    ],
  },

  objective: "Access Charlie's private data without proper authorization",
  flagCondition: 'horizontal_escalation_success',
};
