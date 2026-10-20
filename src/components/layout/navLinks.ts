import type { ui } from '../../i18n/ui';

export const navLinks: { to: string; key: keyof typeof ui }[] = [
  { to: '/about', key: 'about' },
  { to: '/services', key: 'services' }, // выпадающее мега-меню
  { to: '/partners', key: 'partners' },
  { to: '/history', key: 'history' },
  { to: '/contacts', key: 'contacts' },
];
