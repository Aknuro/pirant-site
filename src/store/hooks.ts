import { useMemo } from 'react';
import { digits } from './utils';
import { useSite } from './site';

export const telHref = (n: string) => `tel:+${digits(n)}`;

export function tgUrl(handle: string, text?: string): string {
  const h = handle.trim();
  if (!h) return '';
  const base = /^https?:\/\//i.test(h) ? h : `https://t.me/${h.replace(/^@/, '').replace(/^t\.me\//i, '')}`;
  return text ? `${base}${base.includes('?') ? '&' : '?'}text=${encodeURIComponent(text)}` : base;
}
export const waUrl = (num: string, text?: string) => `https://wa.me/${digits(num)}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

/** Контакты компании из настроек сайта (панель управления → Контакты) */
export function useContacts() {
  const { settings: s } = useSite();
  return useMemo(() => {
    const phone = s.phones[0]?.number ?? '';
    return {
      phones: s.phones, phone, phoneHref: phone ? telHref(phone) : '', whatsapp: s.whatsapp, telegram: s.telegram,
      email: s.email, site: s.site, workHours: s.workHours, offices: s.offices,
    };
  }, [s]);
}

/** Опубликованные направления по порядку */
export function useDirections() {
  const { directions } = useSite();
  return useMemo(() => directions.filter((d) => d.published).sort((a, b) => a.order - b.order), [directions]);
}
