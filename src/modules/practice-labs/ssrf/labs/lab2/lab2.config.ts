export const Lab2Config = {
  labSlug: 'ssrf-lab2',
  description: 'SSRF - Bypassing blacklist filters',

  initialState: {
    blacklist: ['localhost', '127.0.0.1', '0.0.0.0'],
    internalServices: [
      {
        name: 'admin-api',
        url: 'http://127.1/admin/api',
        data: 'FLAG{SSRF_BL4CKL1ST_BYP4SS}',
      },
    ],
  },

  objective: 'Bypass URL blacklist to access internal services',
  flagCondition: 'ssrf_blacklist_bypass',
};
