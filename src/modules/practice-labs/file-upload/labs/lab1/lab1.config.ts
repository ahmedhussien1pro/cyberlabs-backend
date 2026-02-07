export const Lab1Config = {
  labSlug: 'file-upload-lab1',
  description: 'File Upload - Upload malicious files without proper validation',

  initialState: {
    users: [
      {
        username: 'uploader',
        email: 'uploader@test.com',
        role: 'USER',
        password: 'upload123',
      },
    ],
  },

  objective:
    'Upload a malicious file (e.g., .php, .jsp, .exe) bypassing weak validation',
  flagCondition: 'malicious_file_uploaded',
  allowedExtensions: ['.jpg', '.png', '.gif'],
  maxFileSize: 5 * 1024 * 1024, // 5MB
};
