export const Lab1Config = {
  labSlug: 'command-injection-lab1',
  description: 'OS Command Injection - Basic Ping Tool with direct output',

  initialState: {
    // File system state (simulated)
    files: {
      '/flag.txt': 'FLAG{CMD_1NJ3CT10N_B4S1C_P1NG}',
      '/etc/passwd':
        'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000::/home/user:/bin/bash',
    },
  },

  objective: 'Execute OS commands through the ping utility to read /flag.txt',
  flagCondition: 'command_injection_success',
};
