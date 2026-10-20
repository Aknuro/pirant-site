/** ru обязателен; встроенные тексты без перевода используют словарь i18n/content.ts */
export type Lang = 'ru' | 'kk' | 'en';
export type Localized = { ru: string; kk?: string; en?: string };

export interface NewsItem {
  id: number;
  title: Localized;
  date: string; // ISO
  image: string;
  text: Localized;
  showInHistory: boolean;
  year: number;
}

/* ---------------- Направления ---------------- */
export interface Item { icon?: string; title: string; text?: string; list?: string[]; image?: string }
export interface Block { id: string; title: string; intro?: string; cols?: 2 | 3 | 4; ratio?: string; items: Item[] }
export interface Step { title: string; text: string }
export interface Spec { label: string; value: string }
export interface GalleryImage { src: string; caption: string }

/** Направление = карточка на главной + страница /services/:id. Всё редактируется в панели. */
export interface Direction {
  id: string; // совпадает с :id в /services/:id
  order: number;
  published: boolean;
  icon: string;
  title: Localized;
  description: Localized; // кратко, для карточки и меню
  image: string; // картинка карточки
  hero: string; // фон первого экрана страницы
  tagline: string;
  lead: string;
  specs: Spec[];
  blocks: Block[];
  scheme?: { title: string; steps: Step[] };
  gallery: GalleryImage[];
  advantages: string[];
  vendors: string[]; // id партнёров
  createdAt: string;
  updatedAt: string;
}

/* ---------------- Партнёры ---------------- */
export type PartnerCategory = 'radio' | 'security' | 'servers' | 'video' | 'cuav';
export interface Partner {
  id: string;
  name: string;
  category: PartnerCategory;
  logo: string; // пусто — показываем название
  description: Localized;
  featured: boolean; // показывать на главной
}

/* ---------------- Настройки сайта ---------------- */
/** Тексты интерфейса, которые можно переопределить в панели (ключи из i18n/ui.ts) */
export const EDITABLE_TEXTS = ['heroTitle', 'heroSubtitle', 'trust', 'aboutText', 'missionText', 'slogan', 'servicesLead', 'partnersTitle', 'orderText'] as const;
export type EditableTextKey = (typeof EDITABLE_TEXTS)[number];

export interface Settings {
  texts: Partial<Record<EditableTextKey, Localized>>;
  stats: { id: string; value: string; label: Localized }[];
  advantages: { id: string; icon: string; title: Localized; text: Localized }[];
  cycle: { id: string; icon: string; title: string; text: string }[];
  phones: { id: string; label: string; number: string }[];
  whatsapp: string; // только цифры: 77788004477
  telegram: string; // логин или ссылка; пусто — кнопка скрыта
  email: string;
  site: string;
  workHours: string;
  offices: { id: string; city: Localized; address: string; mapQuery: string; phone: string }[];
}

/* ---------------- Обращения ---------------- */
export type InquiryStatus = 'new' | 'in_progress' | 'answered';
export interface Inquiry {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  company: string;
  message: string;
  directionId: string | null;
  directionTitle: string;
  channel: 'site' | 'whatsapp' | 'telegram';
  page: string;
  status: InquiryStatus;
}

/* ---------------- Пользователи панели ---------------- */
export type Role = 'superadmin' | 'manager';
export interface PublicUser { id: string; login: string; name: string; role: Role; totp?: boolean }

export interface SiteData {
  schema: number;
  settings: Settings;
  directions: Direction[];
  news: NewsItem[];
  partners: Partner[];
  inquiries: Inquiry[];
}
