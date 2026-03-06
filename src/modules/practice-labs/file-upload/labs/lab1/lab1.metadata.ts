// src/modules/practice-labs/file-upload/labs/lab1/lab1.metadata.ts
import type { LabMetadata } from '../../../types/lab-metadata.type';

export const fuLab1Metadata: LabMetadata = {
  slug: 'fu-extension-bypass-avatar-upload',
  title: 'File Upload: Extension Bypass — Profile Avatar Webshell',
  ar_title: 'رفع الملفات: تجاوز الامتداد — Webshell عبر صورة الملف الشخصي',
  description:
    'Exploit a file upload vulnerability where the server only validates the file extension using a blacklist. Bypass the restriction by using double extensions, null bytes, or case manipulation to upload a PHP webshell disguised as an image.',
  ar_description:
    'استغل ثغرة رفع ملفات حيث يتحقق الخادم فقط من الامتداد باستخدام blacklist. تجاوز القيود عبر double extensions أو case manipulation لرفع PHP webshell متنكّر كصورة.',
  difficulty: 'BEGINNER',
  category: 'WEB_SECURITY',
  skills: [
    'File Upload',
    'Extension Bypass',
    'Blacklist Bypass',
    'Webshell Upload',
    'Double Extension',
  ],
  xpReward: 120,
  pointsReward: 60,
  duration: 25,
  executionMode: 'SHARED_BACKEND',
  isPublished: true,
  goal: 'The avatar upload blocks .php files using a blacklist. Bypass it using double extension (.php.jpg), case manipulation (.PHP), or other techniques to upload a PHP webshell. Then access the webshell to read /app/flag.txt.',
  scenario: {
    context:
      'SocialHub profile system allows users to upload avatars. The backend checks if the extension is NOT in a blacklist [".php", ".asp", ".jsp"]. An attacker can bypass this using: .php.jpg (double extension), .PHP (uppercase), .php5, .phtml, or .phar.',
    vulnerableCode: `// Avatar upload (vulnerable — blacklist only):
app.post('/profile/avatar', upload.single('file'), (req, res) => {
  const ext = path.extname(req.file.originalname).toLowerCase();
  const blacklist = ['.php', '.asp', '.jsp', '.exe'];
  // ❌ Blacklist is incomplete! .php5, .phtml, .PHP, .php.jpg all bypass it
  if (blacklist.includes(ext)) {
    return res.status(400).json({ error: 'File type not allowed' });
  }
  fs.renameSync(req.file.path, '/uploads/avatars/' + req.file.originalname);
  res.json({ url: '/uploads/avatars/' + req.file.originalname });
});`,
    exploitation:
      'Upload a file named "avatar.php.jpg" or "shell.phtml" containing PHP webshell code. The blacklist only checks the last extension (.jpg passes), but Apache executes .php.jpg as PHP.',
  },
  hints: [
    {
      order: 1,
      xpCost: 10,
      content:
        'The server checks only the last extension. What if you use TWO extensions? "shell.php.jpg" — the blacklist sees ".jpg" but Apache sees PHP.',
    },
    {
      order: 2,
      xpCost: 20,
      content:
        'Try filenames: "avatar.php.jpg", "shell.phtml", "upload.php5", "test.PHP" (uppercase). All bypass a simple blacklist.',
    },
    {
      order: 3,
      xpCost: 35,
      content:
        'POST /profile/avatar/upload with filename: "avatar.php.jpg" and phpCode: "system($_GET[\'cmd\'])". Get back the upload URL.',
    },
    {
      order: 4,
      xpCost: 50,
      content:
        'After upload, POST /profile/avatar/execute with { "filename": "avatar.php.jpg", "cmd": "cat /app/flag.txt" } to get the flag.',
    },
  ],
  flagAnswer: 'FLAG{FILE_UPLOAD_EXTENSION_BYPASS_DOUBLE_EXT_WEBSHELL}',
  initialState: {
    // ✅ مضاف
    contents: [
      {
        title: 'APP_FLAG',
        body: 'SocialHub Server Info\n=====================\nServer: Apache/2.4.54\nPHP: 8.1.0\nUser: www-data\nFLAG: FLAG{FILE_UPLOAD_EXTENSION_BYPASS_DOUBLE_EXT_WEBSHELL}',
        author: 'system_file',
        isPublic: false,
      },
      {
        title: 'UPLOADS_DIR',
        body: 'profile_default.jpg\nbanner_default.png\n.htaccess',
        author: 'system_file',
        isPublic: false,
      },
    ],
  },
};
