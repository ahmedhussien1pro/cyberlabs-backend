export const Lab3Config = {
  labSlug: 'path-traversal-lab3',
  description: 'Path Traversal - Null byte injection',

  initialState: {
    allowedDirectory: '/uploads/documents',
    requiredExtension: '.pdf',
    files: {
      '/uploads/documents/report.pdf': 'Public report',
      '/etc/passwd': 'root:x:0:0:root:/root:/bin/bash',
      '/var/www/secret.txt': 'FLAG{P4TH_TR4V3RS4L_NULL_BYT3}',
    },
  },

  objective: 'Use null byte injection to bypass extension validation',
  flagCondition: 'null_byte_injection',
};
