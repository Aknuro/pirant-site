import { Router, type RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import QRCode from 'qrcode';
import { z } from 'zod';
import { audit, endSession, readChallenge, signChallenge, startSession, toAuthUser, requireAuth } from '../auth.js';
import { config } from '../config.js';
import { q, tx } from '../db.js';
import { checkTotp, decrypt, dummyVerify, encrypt, newBackupCodes, newTotpSecret, normalizeBackup, otpauthUrl, sha256hex, verifyPassword } from '../crypto.js';

export const authRouter = Router();

const asyncRoute = (handler: RequestHandler): RequestHandler => (req, res, next) => {
  void Promise.resolve(handler(req, res, next)).catch(next);
};

const MAX_FAILS = 5;
const LOCK_MIN = 15;
const loginLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Слишком много попыток входа с этого адреса. Повторите позже.' } });

const lockedMsg = (until: Date) => ({ error: `Вход временно заблокирован из-за неверных попыток. Повторите через ${Math.max(1, Math.ceil((+until - Date.now()) / 60000))} мин.` });

async function registerFailure(userId: string) {
  await q(`update users set
      failed_attempts = case when failed_attempts + 1 >= $2 then 0 else failed_attempts + 1 end,
      locked_until = case when failed_attempts + 1 >= $2 then now() + make_interval(mins => $3) else locked_until end
    where id = $1`, [userId, MAX_FAILS, LOCK_MIN]);
}
const registerSuccess = (userId: string) => q('update users set failed_attempts = 0, locked_until = null, last_login_at = now() where id = $1', [userId]);

const getUser = async (id: string) => (await q('select * from users where id = $1', [id])).rows[0];

/* ---------- шаг 1: логин + пароль */
authRouter.post('/login', loginLimiter, asyncRoute(async (req, res) => {
  const p = z.object({ login: z.string().min(1).max(100), password: z.string().min(1).max(200) }).safeParse(req.body);
  if (!p.success) return void res.status(400).json({ error: 'Введите логин и пароль.' });
  const { rows } = await q('select * from users where lower(login) = lower($1)', [p.data.login.trim()]);
  const u = rows[0];
  if (!u) { await dummyVerify(); await audit(req, 'login.fail', 'user', undefined, { login: p.data.login.slice(0, 50) }); return void res.status(401).json({ error: 'Неверный логин или пароль.' }); }
  if (u.locked_until && new Date(u.locked_until) > new Date()) return void res.status(423).json(lockedMsg(new Date(u.locked_until)));
  if (!(await verifyPassword(p.data.password, u.password_hash))) {
    await registerFailure(u.id);
    await audit(req, 'login.fail', 'user', u.id, undefined, { id: u.id, login: u.login });
    return void res.status(401).json({ error: 'Неверный логин или пароль.' });
  }
  if (u.totp_enabled) return void res.json({ step: 'totp', challenge: signChallenge({ uid: u.id, step: 'totp' }) });
  if (config.require2fa) return void res.json({ step: 'setup', challenge: signChallenge({ uid: u.id, step: 'setup' }) });
  await registerSuccess(u.id); startSession(res, u);
  await audit(req, 'login.ok', 'user', u.id, { mfa: false }, { id: u.id, login: u.login });
  res.json({ step: 'done', user: toAuthUser(u) });
}));

/* ---------- шаг 2: код из приложения или резервный код */
authRouter.post('/totp/verify', loginLimiter, asyncRoute(async (req, res) => {
  const p = z.object({ challenge: z.string(), code: z.string().min(1).max(40) }).safeParse(req.body);
  const ch = p.success ? readChallenge(p.data.challenge) : null;
  if (!p.success || !ch || ch.step !== 'totp') return void res.status(401).json({ error: 'Время входа истекло. Введите логин и пароль заново.', restart: true });
  const u = await getUser(ch.uid);
  if (!u || !u.totp_enabled || !u.totp_secret_enc) return void res.status(401).json({ error: 'Войдите заново.', restart: true });
  if (u.locked_until && new Date(u.locked_until) > new Date()) return void res.status(423).json(lockedMsg(new Date(u.locked_until)));

  const code = p.data.code.trim();
  let ok = false, usedBackup = false;
  if (/^\d{6}$/.test(code.replace(/\s/g, ''))) {
    const step = checkTotp(decrypt(u.totp_secret_enc), code.replace(/\s/g, ''));
    // один и тот же код нельзя использовать дважды
    if (step !== null && step > Number(u.totp_last_step)) { ok = true; await q('update users set totp_last_step = $2 where id = $1', [u.id, step]); }
  } else {
    const r = await q('update backup_codes set used_at = now() where id = (select id from backup_codes where user_id = $1 and code_hash = $2 and used_at is null limit 1) returning id', [u.id, sha256hex(normalizeBackup(code))]);
    ok = usedBackup = r.rowCount === 1;
  }
  if (!ok) {
    await registerFailure(u.id);
    await audit(req, 'login.fail', 'user', u.id, { stage: 'totp' }, { id: u.id, login: u.login });
    return void res.status(401).json({ error: 'Неверный код.' });
  }
  await registerSuccess(u.id); startSession(res, u);
  await audit(req, 'login.ok', 'user', u.id, { mfa: true, backupCode: usedBackup }, { id: u.id, login: u.login });
  const left = (await q('select count(*)::int as n from backup_codes where user_id = $1 and used_at is null', [u.id])).rows[0].n;
  res.json({ step: 'done', user: toAuthUser(u), backupCodesLeft: left });
}));

/* ---------- первичная настройка 2FA: секрет + QR */
authRouter.post('/totp/setup', loginLimiter, asyncRoute(async (req, res) => {
  const ch = readChallenge(req.body?.challenge);
  if (!ch || ch.step !== 'setup') return void res.status(401).json({ error: 'Время входа истекло. Введите логин и пароль заново.', restart: true });
  const u = await getUser(ch.uid);
  if (!u || u.totp_enabled) return void res.status(401).json({ error: 'Войдите заново.', restart: true });
  const secret = newTotpSecret();
  await q('update users set totp_secret_enc = $2 where id = $1', [u.id, encrypt(secret)]);
  const url = otpauthUrl(u.login, secret);
  res.json({ secret, otpauthUrl: url, qr: await QRCode.toDataURL(url, { margin: 1, width: 220 }) });
}));

/* ---------- подтверждение 2FA: включаем и выдаём резервные коды (один раз) */
authRouter.post('/totp/enable', loginLimiter, asyncRoute(async (req, res) => {
  const p = z.object({ challenge: z.string(), code: z.string().min(1).max(10) }).safeParse(req.body);
  const ch = p.success ? readChallenge(p.data.challenge) : null;
  if (!p.success || !ch || ch.step !== 'setup') return void res.status(401).json({ error: 'Время входа истекло. Введите логин и пароль заново.', restart: true });
  const u = await getUser(ch.uid);
  if (!u || u.totp_enabled || !u.totp_secret_enc) return void res.status(401).json({ error: 'Войдите заново.', restart: true });
  if (u.locked_until && new Date(u.locked_until) > new Date()) return void res.status(423).json(lockedMsg(new Date(u.locked_until)));
  const step = checkTotp(decrypt(u.totp_secret_enc), p.data.code.replace(/\s/g, ''));
  if (step === null) { await registerFailure(u.id); return void res.status(401).json({ error: 'Неверный код. Проверьте время на телефоне и попробуйте ещё раз.' }); }
  const codes = newBackupCodes();
  await tx(async (c) => {
    await c.query('update users set totp_enabled = true, totp_last_step = $2 where id = $1', [u.id, step]);
    await c.query('delete from backup_codes where user_id = $1', [u.id]);
    for (const code of codes) await c.query('insert into backup_codes(user_id, code_hash) values ($1,$2)', [u.id, sha256hex(normalizeBackup(code))]);
  });
  await registerSuccess(u.id); startSession(res, u);
  await audit(req, '2fa.enabled', 'user', u.id, undefined, { id: u.id, login: u.login });
  res.json({ step: 'done', user: { ...toAuthUser(u), totp: true }, backupCodes: codes });
}));

authRouter.get('/me', async (req, res) => {
  if (!req.user) return void res.status(401).json({ error: 'Не выполнен вход.' });
  res.json({ user: req.user });
});

authRouter.post('/logout', async (req, res) => {
  if (req.user) await audit(req, 'logout', 'user', req.user.id);
  endSession(res);
  res.json({ ok: true });
});

/* ---------- замена собственных резервных кодов (нужен вход) */
authRouter.post('/backup-codes', requireAuth, async (req, res) => {
  const codes = newBackupCodes();
  await tx(async (c) => {
    await c.query('delete from backup_codes where user_id = $1', [req.user!.id]);
    for (const code of codes) await c.query('insert into backup_codes(user_id, code_hash) values ($1,$2)', [req.user!.id, sha256hex(normalizeBackup(code))]);
  });
  await audit(req, '2fa.backup_codes_regenerated', 'user', req.user!.id);
  res.json({ backupCodes: codes });
});
