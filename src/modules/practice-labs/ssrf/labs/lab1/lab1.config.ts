export const Lab1Config = {
  labSlug: 'ssrf-lab1',
  description: 'SSRF - Basic URL fetching vulnerability',

  initialState: {
    internalServices: [
      {
        name: 'admin-panel',
        url: 'http://localhost:8080/admin',
        data: 'FLAG{SSRF_4DM1N_P4N3L_4CC3SS}',
      },
      {
        name: 'metadata-service',
        url: 'http://169.254.169.254/latest/meta-data/',
        data: 'Sensitive AWS metadata',
      },
      {
        name: 'internal-api',
        url: 'http://127.0.0.1:3000/api/internal',
        data: 'Internal API data',
      },
    ],
    allowedDomains: ['api.github.com', 'jsonplaceholder.typicode.com'],
  },

  objective: 'Access internal services by exploiting SSRF in the URL fetcher',
  flagCondition: 'ssrf_internal_access',
};
