export const Lab2Config = {
  labSlug: 'race-condition-lab2',
  description: 'Race Condition - Reuse single-use coupon multiple times',

  initialState: {
    users: [
      {
        username: 'shopper',
        email: 'shopper@shop.com',
        role: 'USER',
        password: 'shop123',
      },
    ],
    banks: [
      { accountNo: 'WALLET', balance: 0 }, // User wallet
    ],
  },

  objective:
    'Use single-use coupon (50$ discount) multiple times to get 200$ in wallet',
  flagCondition: 'wallet_balance >= 200',
  couponCode: 'SAVE50',
  couponValue: 50,
};
