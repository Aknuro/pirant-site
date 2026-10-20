import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import express, { Router } from 'express';
import { z } from 'zod';
import { audit, requireAuth, requireRole } from '../auth.js';
import { config } from '../config.js';
import { loadContent, rowToInquiry } from '../content.js';
import { q, tx } from '../db.js';
import { hashPassword, uid } from '../crypto.js';
import { slugify } from '../slug.js';
import { importContent } from '../seed.js';

export const adminRouter = Router();
adminRouter.use(requireAuth);
const editors = requireRole('superadmin', 'manager');
const superOnly = requireRole('superadmin');

/* ------------------------------------------------ направления */
const Localized = z.object({ ru: z.string(), kk: z.string().optional(), en: z.string().optional() });
const DirectionSchema = z.object({
  id: z.string().max(80).optional().default(''), published: z.boolean().default(true), title: Localized,
}).passthrough();

adminRouter.post('/directions', editors, async (req, res) => {
  const p = DirectionSchema.safeParse(req.body);
  if (!p.success || !p.data.title.ru.trim()) return void res.status(400).json({ error: 'Укажите название направления.' });
  const d: any = p.data;
  let id = slugify(d.id || d.title.ru);
  while ((await q('select 1 from directions where id = $1', [id])).rowCount) id = `${id}-${Math.random().toString(36).slice(2, 5)}`;
  const { id: _i, order: _o, published, createdAt: _c, updatedAt: _u, ...rest } = d;
  const order = (await q('select coalesce(max(sort_order),0)+1 as n from directions')).rows[0].n;
  await q('insert into directions(id, sort_order, published, data) values ($1,$2,$3,$4)', [id, order, published, rest]);
  await audit(req, 'direction.create', 'direction', id);
  res.status(201).json((await loadContent(true)).directions.find((x: any) => x.id === id));
});

adminRouter.put('/directions/:id', editors, async (req, res) => {
  const p = DirectionSchema.safeParse(req.body);
  if (!p.success || !p.data.title.ru.trim()) return void res.status(400).json({ error: 'Укажите название направления.' });
  const { id: _i, order: _o, published, createdAt: _c, updatedAt: _u, ...rest } = p.data as any;
  const r = await q('update directions set published = $2, data = $3, updated_at = now() where id = $1', [req.params.id, published, rest]);
  if (!r.rowCount) return void res.status(404).json({ error: 'Направление не найдено.' });
  await audit(req, 'direction.update', 'direction', req.params.id);
  res.json((await loadContent(true)).directions.find((x: any) => x.id === req.params.id));
});

adminRouter.delete('/directions/:id', editors, async (req, res) => {
  await q('delete from directions where id = $1', [req.params.id]);
  await audit(req, 'direction.delete', 'direction', req.params.id);
  res.json({ ok: true });
});

adminRouter.post('/directions-order', editors, async (req, res) => {
  const p = z.object({ ids: z.array(z.string()).max(200) }).safeParse(req.body);
  if (!p.success) return void res.status(400).json({ error: 'Неверный порядок.' });
  await tx(async (c) => { for (const [i, id] of p.data.ids.entries()) await c.query('update directions set sort_order = $2 where id = $1', [id, i + 1]); });
  await audit(req, 'direction.reorder', 'direction');
  res.json({ ok: true });
});

/* ------------------------------------------------ новости */
const NewsSchema = z.object({ id: z.number().optional(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), showInHistory: z.boolean().default(false), title: Localized }).passthrough();
const newsOut = async (id: number) => (await loadContent(true)).news.find((x: any) => x.id === id);

adminRouter.post('/news', editors, async (req, res) => {
  const p = NewsSchema.safeParse(req.body);
  if (!p.success || !p.data.title.ru.trim()) return void res.status(400).json({ error: 'Укажите заголовок и дату новости.' });
  const { id: _i, date, showInHistory, year: _y, ...rest } = p.data as any;
  const r = await q('insert into news(date, year, show_in_history, data) values ($1,$2,$3,$4) returning id', [date, Number(date.slice(0, 4)), showInHistory, rest]);
  await audit(req, 'news.create', 'news', r.rows[0].id);
  res.status(201).json(await newsOut(r.rows[0].id));
});
adminRouter.put('/news/:id', editors, async (req, res) => {
  const p = NewsSchema.safeParse(req.body);
  const id = Number(req.params.id);
  if (!p.success || !p.data.title.ru.trim()) return void res.status(400).json({ error: 'Укажите заголовок и дату новости.' });
  const { id: _i, date, showInHistory, year: _y, ...rest } = p.data as any;
  const r = await q('update news set date = $2, year = $3, show_in_history = $4, data = $5 where id = $1', [id, date, Number(date.slice(0, 4)), showInHistory, rest]);
  if (!r.rowCount) return void res.status(404).json({ error: 'Новость не найдена.' });
  await audit(req, 'news.update', 'news', id);
  res.json(await newsOut(id));
});
adminRouter.delete('/news/:id', editors, async (req, res) => {
  await q('delete from news where id = $1', [Number(req.params.id)]);
  await audit(req, 'news.delete', 'news', req.params.id);
  res.json({ ok: true });
});

/* ------------------------------------------------ партнёры и настройки (только суперадмин) */
adminRouter.put('/partners', superOnly, async (req, res) => {
  const p = z.array(z.object({ id: z.string().min(1), name: z.string().trim().min(1) }).passthrough()).max(300).safeParse(req.body);
  if (!p.success) return void res.status(400).json({ error: 'У каждого партнёра должно быть название.' });
  await tx(async (c) => {
    await c.query('delete from partners');
    for (const [i, x] of p.data.entries()) { const { id, ...rest } = x as any; await c.query('insert into partners(id, sort_order, data) values ($1,$2,$3)', [id, i + 1, rest]); }
  });
  await audit(req, 'partners.save', 'partners');
  res.json({ ok: true });
});

adminRouter.put('/settings', superOnly, async (req, res) => {
  const p = z.object({ phones: z.array(z.any()), offices: z.array(z.any()) }).passthrough().safeParse(req.body);
  if (!p.success) return void res.status(400).json({ error: 'Неверный формат настроек.' });
  await q('insert into settings(id, data) values (1,$1) on conflict (id) do update set data = excluded.data', [p.data]);
  await audit(req, 'settings.save', 'settings');
  res.json({ ok: true });
});

/* ------------------------------------------------ обращения */
adminRouter.get('/inquiries', editors, async (_req, res) => {
  res.json((await q('select * from inquiries order by created_at desc limit 5000')).rows.map(rowToInquiry));
});
adminRouter.patch('/inquiries/:id', editors, async (req, res) => {
  const p = z.object({ status: z.enum(['new', 'in_progress', 'answered']) }).safeParse(req.body);
  if (!p.success) return void res.status(400).json({ error: 'Неверный статус.' });
  await q('update inquiries set status = $2 where id = $1', [req.params.id, p.data.status]);
  await audit(req, 'inquiry.status', 'inquiry', req.params.id, { status: p.data.status });
  res.json({ ok: true });
});
adminRouter.delete('/inquiries/:id', editors, async (req, res) => {
  await q('delete from inquiries where id = $1', [req.params.id]);
  await audit(req, 'inquiry.delete', 'inquiry', req.params.id);
  res.json({ ok: true });
});

/* ------------------------------------------------ пользователи */
const pub = (r: any) => ({ id: r.id, login: r.login, name: r.name, role: r.role, totp: r.totp_enabled });
adminRouter.get('/users', superOnly, async (_req, res) => {
  res.json((await q('select id, login, name, role, totp_enabled from users order by created_at')).rows.map(pub));
});

const UserSchema = z.object({
  login: z.string().trim().min(1).max(60), name: z.string().trim().max(100).default(''),
  role: z.enum(['superadmin', 'manager']), password: z.string().max(200).default(''), reset2fa: z.boolean().optional(),
});
const PW_ERR = 'Пароль — не короче 10 символов.';

adminRouter.post('/users', superOnly, async (req, res) => {
  const p = UserSchema.safeParse(req.body);
  if (!p.success) return void res.status(400).json({ error: 'Укажите логин.' });
  if (p.data.password.length < 10) return void res.status(400).json({ error: PW_ERR });
  if ((await q('select 1 from users where lower(login) = lower($1)', [p.data.login])).rowCount) return void res.status(409).json({ error: 'Такой логин уже занят.' });
  const id = uid('u');
  await q('insert into users(id, login, name, role, password_hash) values ($1,$2,$3,$4,$5)', [id, p.data.login, p.data.name || p.data.login, p.data.role, await hashPassword(p.data.password)]);
  await audit(req, 'user.create', 'user', id, { login: p.data.login, role: p.data.role });
  res.status(201).json({ ok: true });
});

adminRouter.put('/users/:id', superOnly, async (req, res) => {
  const p = UserSchema.safeParse(req.body);
  if (!p.success) return void res.status(400).json({ error: 'Укажите логин.' });
  const old = (await q('select * from users where id = $1', [req.params.id])).rows[0];
  if (!old) return void res.status(404).json({ error: 'Пользователь не найден.' });
  if ((await q('select 1 from users where lower(login) = lower($1) and id <> $2', [p.data.login, old.id])).rowCount) return void res.status(409).json({ error: 'Такой логин уже занят.' });
  if (p.data.password && p.data.password.length < 10) return void res.status(400).json({ error: PW_ERR });
  if (old.role === 'superadmin' && p.data.role !== 'superadmin' && (await q("select count(*)::int n from users where role = 'superadmin'")).rows[0].n === 1)
    return void res.status(400).json({ error: 'Нельзя снять роль с единственного суперадминистратора.' });
  const killSessions = !!p.data.password || p.data.role !== old.role || !!p.data.reset2fa;
  await tx(async (c) => {
    await c.query('update users set login=$2, name=$3, role=$4, token_version = token_version + $5 where id=$1', [old.id, p.data.login, p.data.name || p.data.login, p.data.role, killSessions && old.id !== req.user!.id ? 1 : 0]);
    if (p.data.password) await c.query('update users set password_hash = $2, failed_attempts = 0, locked_until = null where id = $1', [old.id, await hashPassword(p.data.password)]);
    if (p.data.reset2fa) { await c.query('update users set totp_enabled = false, totp_secret_enc = null, totp_last_step = 0 where id = $1', [old.id]); await c.query('delete from backup_codes where user_id = $1', [old.id]); }
  });
  await audit(req, 'user.update', 'user', old.id, { passwordChanged: !!p.data.password, reset2fa: !!p.data.reset2fa, role: p.data.role });
  res.json({ ok: true });
});

adminRouter.delete('/users/:id', superOnly, async (req, res) => {
  if (req.params.id === req.user!.id) return void res.status(400).json({ error: 'Нельзя удалить самого себя.' });
  await q('delete from users where id = $1', [req.params.id]);
  await audit(req, 'user.delete', 'user', req.params.id);
  res.json({ ok: true });
});

/* ------------------------------------------------ резервная копия, сброс */
adminRouter.get('/data/export', superOnly, async (req, res) => {
  const c = await loadContent(true);
  const inq = (await q('select * from inquiries order by created_at desc')).rows.map(rowToInquiry);
  await audit(req, 'data.export', 'data');
  res.json({ ...c, inquiries: inq });
});
adminRouter.post('/data/import', superOnly, express.json({ limit: '30mb' }), async (req, res) => {
  const d = req.body;
  if (!d || !Array.isArray(d.directions) || !d.settings || !Array.isArray(d.news) || !Array.isArray(d.partners)) return void res.status(400).json({ error: 'Файл не похож на резервную копию сайта PIRANT.' });
  await importContent(d, { withInquiries: Array.isArray(d.inquiries) });
  await audit(req, 'data.import', 'data');
  res.json({ ok: true });
});

/* ------------------------------------------------ журнал и Telegram-получатели */
adminRouter.get('/audit', superOnly, async (_req, res) => {
  res.json((await q('select id, at, user_login, action, entity, entity_id, ip, details from audit_log order by at desc limit 300')).rows);
});
adminRouter.get('/telegram', superOnly, async (_req, res) => {
  res.json({ botEnabled: !!config.telegramToken, recipients: (await q('select chat_id::text as chat_id, label, kind, status, created_at from tg_recipients order by created_at')).rows });
});
adminRouter.post('/telegram/:chatId/approve', superOnly, async (req, res) => {
  await q("update tg_recipients set status = 'approved' where chat_id = $1", [req.params.chatId]);
  await audit(req, 'telegram.approve', 'telegram', req.params.chatId);
  res.json({ ok: true });
});
adminRouter.delete('/telegram/:chatId', superOnly, async (req, res) => {
  await q('delete from tg_recipients where chat_id = $1', [req.params.chatId]);
  await audit(req, 'telegram.remove', 'telegram', req.params.chatId);
  res.json({ ok: true });
});

/* ------------------------------------------------ загрузка изображений */
const EXT: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif' };
adminRouter.post('/upload', editors, express.raw({ type: ['image/webp', 'image/jpeg', 'image/png', 'image/gif'], limit: '8mb' }), async (req, res) => {
  const type = String(req.headers['content-type'] || '').split(';')[0];
  const ext = EXT[type];
  if (!ext || !Buffer.isBuffer(req.body) || !req.body.length) return void res.status(400).json({ error: 'Допустимы изображения WebP, JPEG, PNG и GIF до 8 МБ.' });
  const b = req.body as Buffer;
  const magic = (b[0] === 0x52 && b.subarray(8, 12).toString() === 'WEBP') || (b[0] === 0xff && b[1] === 0xd8) || (b[0] === 0x89 && b[1] === 0x50) || b.subarray(0, 3).toString() === 'GIF';
  if (!magic) return void res.status(400).json({ error: 'Файл не похож на изображение.' });
  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const dir = resolve(config.uploadDir); mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), b);
  await audit(req, 'upload', 'file', name);
  res.status(201).json({ url: `/uploads/${name}` });
});
