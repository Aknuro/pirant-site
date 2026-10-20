import { q } from './db.js';

/** Сборка данных сайта из таблиц в тот же формат SiteData, который ждёт фронтенд. */
export async function loadContent(includeDrafts: boolean) {
  const [dirs, news, partners, settings] = await Promise.all([
    q(`select id, sort_order, published, data, created_at, updated_at from directions ${includeDrafts ? '' : 'where published'} order by sort_order, id`),
    q('select id, date, year, show_in_history, data from news order by date desc, id desc'),
    q('select id, data from partners order by sort_order, id'),
    q('select data from settings where id = 1'),
  ]);
  return {
    schema: 1,
    settings: settings.rows[0]?.data ?? { texts: {}, stats: [], advantages: [], cycle: [], phones: [], whatsapp: '', telegram: '', email: '', site: '', workHours: '', offices: [] },
    directions: dirs.rows.map((r) => ({ ...r.data, id: r.id, order: r.sort_order, published: r.published, createdAt: r.created_at.toISOString(), updatedAt: r.updated_at.toISOString() })),
    news: news.rows.map((r) => ({ ...r.data, id: r.id, date: r.date, year: r.year, showInHistory: r.show_in_history })),
    partners: partners.rows.map((r) => ({ ...r.data, id: r.id })),
  };
}

export const rowToInquiry = (r: any) => ({
  id: r.id, createdAt: r.created_at.toISOString(), name: r.name, phone: r.phone, company: r.company, message: r.message,
  directionId: r.direction_id, directionTitle: r.direction_title, channel: r.channel, page: r.page, status: r.status,
});
