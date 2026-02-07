export const Lab2Config = {
  labSlug: 'command-injection-lab2',
  description:
    'Blind Command Injection - Status Checker with time-based detection',

  initialState: {
    files: {
      '/flag.txt': 'FLAG{BL1ND_CMD_1NJ3CT10N_T1M3_B4S3D}',
    },
    servers: [
      { name: 'google.com', status: 'online' },
      { name: 'localhost', status: 'online' },
    ],
  },

  objective:
    'Exploit blind command injection using time delays and output redirection',
  flagCondition: 'blind_injection_success',
};
