export const Lab3Config = {
  labSlug: 'idor-lab3',
  description: 'IDOR - Enumerate and modify other users profiles',

  initialState: {
    users: [
      {
        username: 'user1',
        email: 'user1@test.com',
        role: 'USER',
        password: 'pass1',
        meta: { bio: 'Regular user' }, // ✅ نستخدم meta
      },
      {
        username: 'user2',
        email: 'user2@test.com',
        role: 'USER',
        password: 'pass2',
        meta: { bio: 'Another user' },
      },
      {
        username: 'premium',
        email: 'premium@test.com',
        role: 'PREMIUM',
        password: 'premium123',
        meta: { bio: 'Premium member with flag: FLAG{IDOR_PROFILE_ENUM}' },
      },
    ],
  },

  objective: 'Access premium user profile to get the flag',
  flagCondition: 'read_premium_profile',
};
