export const Lab2Config = {
  labSlug: 'bl-vuln-lab2',
  description:
    'Business Logic - Stack multiple discounts to get items for free',

  initialState: {
    users: [
      {
        username: 'shopper',
        email: 'shopper@shop.com',
        role: 'USER',
        password: 'shop123',
      },
    ],
    banks: [{ accountNo: 'WALLET', balance: 10 }],
  },

  objective:
    'Stack discounts to reduce price to zero or negative (original: 100$, coupons: 20% off each)',
  flagCondition: 'discount_stacking_success',
};
