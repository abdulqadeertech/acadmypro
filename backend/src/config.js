import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stablePath = value => path.isAbsolute(value) ? value : path.resolve(backendRoot, value);

export const config = {
  port: Number(process.env.PORT || 5000),
  jwtSecret: process.env.JWT_SECRET || 'academypro-dev-secret-change-me-in-production',
  jwtExpiry: process.env.JWT_EXPIRY || '8h',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  dbFile: stablePath(process.env.DB_FILE || './data/academypro.sqlite'),
  uploadDir: stablePath(process.env.UPLOAD_DIR || './uploads'),
  maxFileSize: Number(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024), // 10MB
  smsProvider: process.env.SMS_PROVIDER || 'not_configured',
  smsApiKey: process.env.SMS_API_KEY || '',
  emailSmtp: process.env.EMAIL_SMTP || '',
  emailUser: process.env.EMAIL_USER || '',
  emailPass: process.env.EMAIL_PASS || '',
};

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.includes('change-me')) {
    throw new Error('JWT_SECRET must be a strong, unique value in production');
  }
}
