import 'dotenv/config';

const env = process.env;
const isProd = env.NODE_ENV === 'production';

function required(name: string): string {
  const v = env[name];
  if (!v) throw new Error(`Не задана переменная окружения ${name} (см. .env.example)`);
  return v;
}

export const config = {
  isProd,
  port: Number(env.PORT || 3001),
  publicUrl: (env.PUBLIC_URL || 'http://localhost:5173').replace(/\/+$/, ''),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  encKey: Buffer.from(required('APP_ENC_KEY'), 'hex'),
  require2fa: (env.REQUIRE_2FA ?? 'true') !== 'false',
  uploadDir: env.UPLOAD_DIR || './uploads',
  telegramToken: env.TELEGRAM_BOT_TOKEN || '',
  smtp: {
    host: env.SMTP_HOST || '',
    port: Number(env.SMTP_PORT || 465),
    secure: (env.SMTP_SECURE ?? 'true') !== 'false',
    user: env.SMTP_USER || '',
    pass: env.SMTP_PASS || '',
    from: env.MAIL_FROM || 'PIRANT сайт <no-reply@localhost>',
  },
  notifyEmails: (env.NOTIFY_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean),
};

if (config.encKey.length !== 32) throw new Error('APP_ENC_KEY должен быть 64 hex-символа (32 байта): openssl rand -hex 32');
if (isProd && config.jwtSecret.length < 32) throw new Error('JWT_SECRET слишком короткий: нужно не меньше 32 символов');
