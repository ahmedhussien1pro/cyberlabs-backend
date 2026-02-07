export const Lab3Config = {
  labSlug: 'race-condition-lab3',
  description: 'Race Condition - Buy more items than available stock',

  initialState: {
    users: [
      {
        username: 'buyer',
        email: 'buyer@shop.com',
        role: 'USER',
        password: 'buy123',
      },
    ],
  },

  objective: 'Exploit race condition to buy 10 items when only 3 are in stock',
  flagCondition: 'purchased_items >= 10',
  initialStock: 3,
};
