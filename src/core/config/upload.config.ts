import { registerAs } from '@nestjs/config';

/**
 * File Upload Configuration
 */
export default registerAs('upload', () => ({
  storage: process.env.UPLOAD_STORAGE || 'local',
  maxSize: Number(process.env.UPLOAD_MAX_SIZE) || 10485760, // 10MB
  allowedTypes: (
    process.env.UPLOAD_ALLOWED_TYPES ||
    'image/jpeg,image/png,image/gif,application/pdf'
  ).split(','),

  // Local storage path
  localPath: './uploads',

  // Upload limits per file type
  limits: {
    image: 5242880, // 5MB
    video: 104857600, // 100MB
    document: 10485760, // 10MB
  },
}));
