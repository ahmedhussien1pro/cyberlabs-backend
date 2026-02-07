export const Lab3Config = {
  labSlug: 'command-injection-lab3',
  description: 'Command Injection via HTTP Headers - User-Agent logging',

  initialState: {
    files: {
      '/flag.txt': 'FLAG{H34D3R_CMD_1NJ3CT10N_US3R_4G3NT}',
    },
    logs: [],
  },

  objective: 'Inject commands through User-Agent header in request logger',
  flagCondition: 'header_injection_success',
};
