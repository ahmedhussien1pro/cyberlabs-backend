export const Lab3Config = {
  labSlug: 'file-upload-lab3',
  description:
    'File Upload - Path traversal to upload files in arbitrary locations',

  initialState: {
    users: [
      {
        username: 'uploader',
        email: 'uploader@storage.com',
        role: 'USER',
        password: 'upload123',
      },
    ],
  },

  objective: 'Use path traversal to upload file outside intended directory',
  flagCondition: 'path_traversal_exploited',
  uploadDirectory: '/uploads/user-files/',
};
