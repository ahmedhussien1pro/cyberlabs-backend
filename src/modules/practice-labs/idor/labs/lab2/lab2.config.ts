export const Lab2Config = {
  labSlug: 'idor-lab2',
  description: 'IDOR - Access other users files without authorization',

  initialState: {
    users: [
      {
        username: 'alice',
        email: 'alice@company.com',
        role: 'USER',
        password: 'pass123',
      },
      {
        username: 'bob',
        email: 'bob@company.com',
        role: 'USER',
        password: 'pass456',
      },
      {
        username: 'admin',
        email: 'admin@company.com',
        role: 'ADMIN',
        password: 'admin999',
      },
    ],
    contents: [
      {
        title: 'Alice Private Doc',
        body: 'Salary: $80,000',
        author: 'alice',
        isPublic: false, // ✅ الحقل الصحيح من Schema
      },
      {
        title: 'Bob Notes',
        body: 'Meeting notes...',
        author: 'bob',
        isPublic: false,
      },
      {
        title: 'Admin Secret',
        body: 'FLAG{IDOR_FILE_ACCESS_MASTER}',
        author: 'admin',
        isPublic: false,
      },
    ],
  },

  objective: 'Access admin secret document to get the flag',
  flagCondition: 'read_admin_document',
};
