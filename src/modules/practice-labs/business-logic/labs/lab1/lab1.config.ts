export const Lab1Config = {
  labSlug: 'bl-vuln-lab1',
  description:
    'Business Logic - Price manipulation to buy items at negative/zero cost',

  initialState: {
    users: [
      {
        username: 'buyer',
        email: 'buyer@shop.com',
        role: 'USER',
        password: 'buyer123',
      },
    ],
    banks: [
      { accountNo: 'WALLET', balance: 50 }, // Limited budget
    ],
  },

  objective:
    'Exploit price manipulation to buy expensive item (worth 1000$) with only 50$',
  flagCondition: 'price_manipulation_success',
  itemPrice: 1000,
};
