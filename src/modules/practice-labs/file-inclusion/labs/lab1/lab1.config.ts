export const Lab1Config = {
  labSlug: 'file-inclusion-lab1',
  description: 'LFI - Local File Inclusion via page parameter',

  initialState: {
    pages: {
      home: '/views/home.php',
      about: '/views/about.php',
      contact: '/views/contact.php',
    },
    sensitiveFiles: {
      '/etc/passwd':
        'root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin',
      '/var/www/html/config.php':
        '<?php $db_password = "super_secret_123"; $flag = "FLAG{LF1_B4S1C_1NCLUS10N}"; ?>',
      '/proc/self/environ':
        'USER=www-data\nPATH=/usr/bin\nSCRIPT_NAME=/index.php',
    },
  },

  objective: 'Include sensitive files using LFI vulnerability',
  flagCondition: 'lfi_config_read',
};
