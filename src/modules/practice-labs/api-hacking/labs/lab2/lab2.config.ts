export const Lab2Config = {
  labSlug: 'api-hacking-lab2',
  description: 'API Security - Excessive Data Exposure in API responses',

  initialState: {
    users: [
      {
        username: 'john',
        email: 'john@company.com',
        role: 'USER',
        password: 'john123',
      },
      {
        username: 'admin',
        email: 'admin@company.com',
        role: 'ADMIN',
        password: 'FLAG{API_DATA_EXPOSURE}',
      },
    ],
  },

  objective: 'Extract sensitive data exposed in API responses',
  flagCondition: 'excessive_data_exposure',
};
