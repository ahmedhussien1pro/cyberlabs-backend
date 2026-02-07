import { registerAs } from '@nestjs/config';

/**
 * AWS Configuration
 * S3 for file storage
 */
export default registerAs('aws', () => ({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',

  s3: {
    bucket: process.env.AWS_S3_BUCKET,
    endpoint: process.env.AWS_S3_ENDPOINT,
    signatureVersion: 'v4',
  },
}));
