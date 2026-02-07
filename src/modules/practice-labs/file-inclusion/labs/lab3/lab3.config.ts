export const Lab3Config = {
  labSlug: 'file-inclusion-lab3',
  description: 'LFI to RCE - Using log poisoning',

  initialState: {
    logFile: '/var/log/apache2/access.log',
    allowLFI: true,
    userAgentLogging: true,
  },

  objective: 'Poison log files with PHP code and include them for RCE',
  flagCondition: 'log_poisoning_rce',
};
