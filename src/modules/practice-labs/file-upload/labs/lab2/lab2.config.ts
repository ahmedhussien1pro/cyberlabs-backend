export const Lab2Config = {
  labSlug: 'file-upload-lab2',
  description: 'File Upload - Bypass MIME type and content validation',

  initialState: {
    users: [
      {
        username: 'user',
        email: 'user@upload.com',
        role: 'USER',
        password: 'user123',
      },
    ],
  },

  objective:
    'Upload executable content disguised as image by spoofing MIME type',
  flagCondition: 'mime_type_bypassed',
};
