export const Lab3Config = {
  labSlug: 'ac-vuln-lab3',
  description:
    'Access Control - Parameter tampering to access restricted resources',

  initialState: {
    users: [
      {
        username: 'customer',
        email: 'customer@shop.com',
        role: 'USER',
        password: 'cust123',
      },
    ],
    banks: [
      { accountNo: 'ACC-001', balance: 100 }, // Customer account
      { accountNo: 'ACC-VIP', balance: 10000 }, // VIP account
    ],
  },

  objective: 'Tamper with parameters to access VIP account with high balance',
  flagCondition: 'parameter_tampering_success',
};
