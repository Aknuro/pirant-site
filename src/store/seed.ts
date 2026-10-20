import { advantages, contacts, cycle, news, partners, services, stats } from '../data/mockData';
import { servicesContent } from '../data/servicesContent';
import type { Direction, SiteData } from '../types';
import { nowISO } from './utils';

export const SCHEMA = 1;

/** Начальные данные сайта: собираются из data/mockData.ts и data/servicesContent.ts */
export function buildSeed(): SiteData {
  const now = nowISO();
  const directions: Direction[] = services.map((s, i) => {
    const c = servicesContent.find((x) => x.id === s.id)!;
    return {
      id: s.id, order: i + 1, published: true, icon: s.icon, title: s.title, description: s.description, image: s.image,
      hero: c.hero, tagline: c.tagline, lead: c.lead,
      specs: c.specs ?? [],
      blocks: c.blocks.map((b, n) => ({ ...b, id: `${s.id}-b${n + 1}` })),
      scheme: c.scheme,
      gallery: c.gallery ?? [],
      advantages: c.advantages,
      vendors: c.vendors,
      createdAt: '2026-06-01T09:00:00.000Z', updatedAt: now,
    };
  });
  return {
    schema: SCHEMA,
    settings: {
      texts: {},
      stats: stats.map((s, i) => ({ id: `stat-${i + 1}`, value: s.value, label: s.label })),
      advantages: advantages.map((a, i) => ({ id: `adv-${i + 1}`, icon: a.icon, title: { ru: a.title.ru, en: a.title.en }, text: { ru: a.text } })),
      cycle: cycle.map((c, i) => ({ id: `cyc-${i + 1}`, ...c })),
      phones: [{ id: 'ph-1', label: 'Основной', number: contacts.phone }, { id: 'ph-2', label: 'Дополнительный', number: contacts.phone2 }],
      whatsapp: contacts.whatsapp, telegram: contacts.telegram, email: contacts.email, site: contacts.site, workHours: '',
      offices: contacts.offices.map((o) => ({ id: o.id, city: o.city, address: o.address, mapQuery: o.mapQuery, phone: o.phone })),
    },
    directions,
    news: news.map((n) => ({ ...n })),
    partners: partners.map((p) => ({ ...p })),
    inquiries: [],
  };
}

