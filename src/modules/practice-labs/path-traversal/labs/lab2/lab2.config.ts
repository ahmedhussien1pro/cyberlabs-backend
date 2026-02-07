export const Lab2Config = {
  labSlug: 'path-traversal-lab2',
  description: 'Path Traversal - Bypassing basic filters',

  initialState: {
    allowedDirectory: '/var/www/public',
    blockedPatterns: ['../'],
    files: {
      '/var/www/public/docs/file.pdf': 'Public document',
      '/var/www/flag.txt': 'FLAG{P4TH_TR4V3RS4L_F1LT3R_BYP4SS}',
      '/etc/shadow': 'root:$6$encrypted_hash',
    },
  },

  objective: 'Bypass path traversal filters to read the flag',
  flagCondition: 'path_traversal_filter_bypass',
};
