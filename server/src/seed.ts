import { tx } from './db.js';

/** Заменяет содержимое сайта данными из объекта формата SiteData (из seed.json или резервной копии). */
export async function importContent(d: any, opts: { withInquiries: boolean }) {
  await tx(async (c) => {
    await c.query('delete from directions'); await c.query('delete from news'); await c.query('delete from partners');
    for (const [i, x] of d.directions.entries()) {
      const { id, order, published, createdAt, updatedAt, ...rest } = x;
      await c.query('insert into directions(id, sort_order, published, data, created_at, updated_at) values ($1,$2,$3,$4,coalesce($5::timestamptz, now()),coalesce($6::timestamptz, now()))',
        [id, order ?? i + 1, published !== false, rest, createdAt ?? null, updatedAt ?? null]);
    }
    for (const n of d.news) {
      const { id, date, year, showInHistory, ...rest } = n;
      await c.query('insert into news(id, date, year, show_in_history, data) values ($1,$2,$3,$4,$5)', [id, date, Number(String(date).slice(0, 4)) || year, !!showInHistory, rest]);
    }
    await c.query("select setval(pg_get_serial_sequence('news','id'), coalesce((select max(id) from news), 1))");
    for (const [i, p] of d.partners.entries()) { const { id, ...rest } = p; await c.query('insert into partners(id, sort_order, data) values ($1,$2,$3)', [id, i + 1, rest]); }
    await c.query('insert into settings(id, data) values (1,$1) on conflict (id) do update set data = excluded.data', [d.settings]);
    if (opts.withInquiries) {
      for (const i of d.inquiries) {
        await c.query(`insert into inquiries(id, created_at, name, phone, company, message, direction_id, direction_title, channel, page, status)
          values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) on conflict (id) do nothing`,
          [i.id, i.createdAt, i.name, i.phone, i.company ?? '', i.message ?? '', i.directionId ?? null, i.directionTitle ?? '', i.channel ?? 'site', i.page ?? '', ['new', 'in_progress', 'answered'].includes(i.status) ? i.status : 'new']);
      }
    }
  });
}
