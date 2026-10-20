import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomInt, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { config } from './config.js';

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/* ------------------------------------------------ пароли (scrypt) */
export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(pw, salt, 64, SCRYPT);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}
export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [alg, saltHex, keyHex] = stored.split('$');
  if (alg !== 'scrypt' || !saltHex || !keyHex) return false;
  const key = await scrypt(pw, Buffer.from(saltHex, 'hex'), 64, SCRYPT);
  const want = Buffer.from(keyHex, 'hex');
  return key.length === want.length && timingSafeEqual(key, want);
}
/** Ложная проверка, чтобы время ответа не выдавало, существует ли логин. */
const DUMMY = `scrypt$${'00'.repeat(16)}$${'00'.repeat(64)}`;
export const dummyVerify = () => verifyPassword('x', DUMMY);

/* ------------------------------------------------ шифрование секретов (AES-256-GCM) */
export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', config.encKey, iv);
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString('base64')).join('.');
}
export function decrypt(blob: string): string {
  const [iv, tag, enc] = blob.split('.').map((s) => Buffer.from(s, 'base64'));
  const d = createDecipheriv('aes-256-gcm', config.encKey, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString('utf8');
}

/* ------------------------------------------------ TOTP (RFC 6238, SHA-1, 6 цифр, 30 с) */
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32Encode(buf: Buffer): string {
  let bits = 0, value = 0, out = '';
  for (const byte of buf) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}
export function base32Decode(s: string): Buffer {
  let bits = 0, value = 0; const out: number[] = [];
  for (const ch of s.replace(/=+$/, '').toUpperCase()) {
    const i = B32.indexOf(ch); if (i < 0) continue;
    value = (value << 5) | i; bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}
export const newTotpSecret = () => base32Encode(randomBytes(20));

function hotp(secret: Buffer, counter: number): string {
  const b = Buffer.alloc(8); b.writeBigUInt64BE(BigInt(counter));
  const h = createHmac('sha1', secret).update(b).digest();
  const o = h[h.length - 1] & 15;
  const code = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(code % 1_000_000).padStart(6, '0');
}
/** Возвращает номер 30-секундного шага, если код верный (окно ±1 шаг), иначе null. */
export function checkTotp(secretB32: string, code: string, now = Date.now()): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const secret = base32Decode(secretB32);
  const step = Math.floor(now / 30000);
  for (const d of [0, -1, 1]) {
    const a = Buffer.from(hotp(secret, step + d)), b = Buffer.from(code);
    if (timingSafeEqual(a, b)) return step + d;
  }
  return null;
}
export const otpauthUrl = (login: string, secret: string) =>
  `otpauth://totp/${encodeURIComponent(`PIRANT:${login}`)}?secret=${secret}&issuer=PIRANT&algorithm=SHA1&digits=6&period=30`;

/* ------------------------------------------------ резервные коды и прочее */
const CODE_ALPHA = 'abcdefghjkmnpqrstuvwxyz23456789';
export function newBackupCodes(n = 8): string[] {
  return Array.from({ length: n }, () => {
    const s = Array.from({ length: 10 }, () => CODE_ALPHA[randomInt(CODE_ALPHA.length)]).join('');
    return `${s.slice(0, 5)}-${s.slice(5)}`;
  });
}
export const normalizeBackup = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '');
export const sha256hex = (s: string) => createHash('sha256').update(s).digest('hex');
export const hashIp = (ip: string) => createHmac('sha256', config.jwtSecret).update(ip).digest('hex').slice(0, 24);
export const uid = (prefix: string) => `${prefix}-${randomBytes(8).toString('hex')}`;
