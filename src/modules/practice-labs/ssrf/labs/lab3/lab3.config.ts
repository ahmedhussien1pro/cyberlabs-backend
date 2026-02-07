export const Lab3Config = {
  labSlug: 'ssrf-lab3',
  description: 'SSRF - Open redirect to SSRF',

  initialState: {
    redirectEndpoint: '/redirect',
    internalServices: [
      {
        name: 'metadata',
        url: 'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
        data: 'FLAG{SSRF_0P3N_R3D1R3CT_2_M3T4D4T4}',
      },
    ],
  },

  objective: 'Chain open redirect with SSRF to access cloud metadata',
  flagCondition: 'ssrf_redirect_chain',
};
