export const Lab1Config = {
  labSlug: 'path-traversal-lab1',
  description: 'Path Traversal - Basic directory traversal in file viewer',

  initialState: {
    allowedDirectory: '/public/images',
    files: {
      '/public/images/image1.jpg': 'Public image 1',
      '/public/images/image2.jpg': 'Public image 2',
      '/etc/passwd':
        'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000::/home/user:/bin/bash',
      '/var/www/flag.txt': 'FLAG{P4TH_TR4V3RS4L_B4S1C}',
      '/app/config.json': '{"secret": "admin_password_123"}',
    },
  },

  objective:
    'Read sensitive files outside the allowed directory using path traversal',
  flagCondition: 'path_traversal_success',
};
