import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { clientIp } from '../auth.js';
import { loadContent } from '../content.js';
import { q } from '../db.js';
import { hashIp, uid } from '../crypto.js';
import { notifyNewInquiry } from '../notify.js';

export const publicRouter = Router();

/** Всё содержимое сайта: опубликованные направления, новости, партнёры, настройки. Для вошедшего сотрудника — включая черновики. */
publicRouter.get('/site', async (req, res) => {
  const c = await loadContent(!!req.user);
  res.set('Cache-Control', 'no-store');
  res.json(c);
});

const inquiryLimiter = rateLimit({ windowMs: 60 * 60_000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { error: 'Слишком много заявок с этого адреса. Попробуйте позже или позвоните нам.' } });

const InquirySchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(5).max(40),
  company: z.string().trim().max(200).optional().default(''),
  message: z.string().trim().max(3000).optional().default(''),
  directionId: z.string().max(100).nullable().optional(),
  page: z.string().max(300).optional().default(''),
  website: z.string().optional(), // ловушка для ботов: настоящие посетители поле не видят
});

publicRouter.post('/inquiries', inquiryLimiter, async (req, res) => {
  const p = InquirySchema.safeParse(req.body);
  if (!p.success) return void res.status(400).json({ error: 'Проверьте имя и телефон.' });
  if (p.data.website) return void res.json({ ok: true }); // бот: делаем вид, что приняли
  let directionTitle = '';
  if (p.data.directionId) {
    const d = await q("select data->'title'->>'ru' as t from directions where id = $1", [p.data.directionId]);
    directionTitle = d.rows[0]?.t ?? '';
  }
  await q('insert into inquiries(id, name, phone, company, message, direction_id, direction_title, channel, page, ip_hash) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
    [uid('q'), p.data.name, p.data.phone, p.data.company, p.data.message, directionTitle ? p.data.directionId : null, directionTitle, 'site', p.data.page, hashIp(clientIp(req))]);
  void notifyNewInquiry(); // уведомление не задерживает ответ посетителю
  res.status(201).json({ ok: true });
});
