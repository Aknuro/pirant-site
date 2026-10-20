import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { q } from './db.js';

export type Role = 'superadmin' | 'manager';
export interface AuthUser { id: string; login: string; name: string; role: Role; totp: boolean }

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express { interface Request { user?: AuthUser } }
}

const COOKIE = 'pirant_session';
const SESSION_HOURS = 8;

export const clientIp = (req: Request) => req.ip || req.socket.remoteAddress || '';

/* ------------------------------------------------ сессия (JWT в httpOnly-cookie) */
export function startSession(res: Response, u: { id: string; token_version: number }) {
  const token = jwt.sign({ sub: u.id, tv: u.token_version, k: 'session' }, config.jwtSecret, { expiresIn: `${SESSION_HOURS}h` });
  res.cookie(COOKIE, token, { httpOnly: true, secure: config.isProd, sameSite: 'strict', maxAge: SESSION_HOURS * 3600_000, path: '/' });
}
export const endSession = (res: Response) => { res.clearCookie(COOKIE, { path: '/' }); };

/* ------------------------------------------------ короткий «пропуск» между шагами входа */
export type Challenge = { uid: string; step: 'totp' | 'setup' };
export const signChallenge = (c: Challenge) => jwt.sign({ ...c, k: 'mfa' }, config.jwtSecret, { expiresIn: '10m' });
export function readChallenge(token: unknown): Challenge | null {
  try {
    const p = jwt.verify(String(token || ''), config.jwtSecret) as any;
    return p.k === 'mfa' ? { uid: p.uid, step: p.step } : null;
  } catch { return null; }
}

export const toAuthUser = (r: any): AuthUser => ({ id: r.id, login: r.login, name: r.name, role: r.role, totp: !!r.totp_enabled });

async function loadUser(req: Request): Promise<AuthUser | null> {
  const token = req.cookies?.[COOKIE];
  if (!token) return null;
  try {
    const p = jwt.verify(token, config.jwtSecret) as any;
    if (p.k !== 'session') return null;
    const { rows } = await q('select id, login, name, role, totp_enabled, token_version from users where id = $1', [p.sub]);
    if (!rows[0] || rows[0].token_version !== p.tv) return null;
    return toAuthUser(rows[0]);
  } catch { return null; }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  req.user = (await loadUser(req)) ?? undefined;
  next();
}
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return void res.status(401).json({ error: 'Войдите в панель управления.' });
  next();
}
export const requireRole = (...roles: Role[]) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return void res.status(401).json({ error: 'Войдите в панель управления.' });
  if (!roles.includes(req.user.role)) return void res.status(403).json({ error: 'Недостаточно прав для этого действия.' });
  next();
};

/** Доп. защита от CSRF поверх SameSite=Strict: у изменяющих запросов Origin должен совпадать с сайтом. */
export function originGuard(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin) {
    const allowed = new Set([config.publicUrl, `${req.protocol}://${req.get('host')}`]);
    if (!config.isProd) allowed.add('http://localhost:5173');
    if (!allowed.has(origin)) return void res.status(403).json({ error: 'Запрос отклонён.' });
  }
  next();
}

/* ------------------------------------------------ журнал действий */
export async function audit(req: Request, action: string, entity?: string, entityId?: string | number, details?: unknown, actor?: { id: string; login: string }) {
  try {
    const who = actor ?? req.user;
    await q('insert into audit_log(user_id, user_login, action, entity, entity_id, ip, details) values ($1,$2,$3,$4,$5,$6,$7)',
      [who?.id ?? null, who?.login ?? null, action, entity ?? null, entityId != null ? String(entityId) : null, clientIp(req), details ? JSON.stringify(details) : null]);
  } catch (e) { console.error('audit:', e); }
}
