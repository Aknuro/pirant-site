import { useSyncExternalStore } from 'react';
import type { Direction, Inquiry, InquiryStatus, NewsItem, Partner, PublicUser, Role, Settings, SiteData } from '../types';
import { api } from './api';
import { clone } from './utils';

/* ------------------------------------------------------------------ состояние */
const EMPTY: SiteData = {
  schema: 1, directions: [], news: [], partners: [], inquiries: [],
  settings: { texts: {}, stats: [], advantages: [], cycle: [], phones: [], whatsapp: '', telegram: '', email: '', site: '', workHours: '', offices: [] },
};
let data: SiteData = EMPTY;
let users: PublicUser[] = [];
let session: PublicUser | null = null;
let ready = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };

/** Загружает всё, что доступно текущему пользователю: публичный контент, а для сотрудников — ещё обращения и пользователей. */
async function refresh() {
  const site = await api<Omit<SiteData, 'inquiries'>>('GET', '/site');
  let inquiries: Inquiry[] = [];
  if (session) { try { inquiries = await api<Inquiry[]>('GET', '/admin/inquiries'); } catch { /* нет прав или сеть */ } }
  data = { ...site, inquiries };
  if (session?.role === 'superadmin') { try { users = await api<PublicUser[]>('GET', '/admin/users'); } catch { /* */ } } else users = [];
  emit();
}

let poll: ReturnType<typeof setInterval> | null = null;
function syncPolling() {
  if (session && !poll) poll = setInterval(() => { if (document.visibilityState === 'visible') void refresh().catch(() => {}); }, 30_000);
  if (!session && poll) { clearInterval(poll); poll = null; }
}

export async function initStore() {
  try { session = (await api<{ user: PublicUser }>('GET', '/auth/me')).user; } catch { session = null; }
  try { await refresh(); } catch (e) { console.error('Не удалось загрузить данные сайта:', e); }
  syncPolling();
  ready = true;
  emit();
}

/* ------------------------------------------------------------------ хуки */
export function useSite(): SiteData { return useSyncExternalStore(subscribe, () => data); }
export function useStoreReady(): boolean { return useSyncExternalStore(subscribe, () => ready); }
export function useSession(): PublicUser | null { return useSyncExternalStore(subscribe, () => session); }
export function useUsers(): PublicUser[] { return useSyncExternalStore(subscribe, () => users); }

const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order;

/* ------------------------------------------------------------------ вход */
export type LoginStep =
  | { step: 'totp'; challenge: string }
  | { step: 'setup'; challenge: string }
  | { step: 'done'; user: PublicUser; backupCodes?: string[] };

function finishLogin(user: PublicUser) {
  session = user;
  emit();
  syncPolling();
  void refresh().catch((e) => console.error('Не удалось загрузить данные панели:', e));
}

/* ------------------------------------------------------------------ действия */
export const store = {
  async login(login: string, password: string): Promise<LoginStep> {
    const r = await api<LoginStep>('POST', '/auth/login', { login, password });
    if (r.step === 'done') await finishLogin(r.user);
    return r;
  },
  async verifyTotp(challenge: string, code: string): Promise<LoginStep> {
    const r = await api<LoginStep>('POST', '/auth/totp/verify', { challenge, code });
    if (r.step === 'done') await finishLogin(r.user);
    return r;
  },
  setupTotp: (challenge: string) => api<{ secret: string; qr: string }>('POST', '/auth/totp/setup', { challenge }),
  /** Включает 2FA. Сессия НЕ открывается, пока пользователь не сохранит резервные коды — см. confirmSession. */
  async enableTotp(challenge: string, code: string): Promise<{ user: PublicUser; backupCodes: string[] }> {
    const r = await api<{ user: PublicUser; backupCodes: string[] }>('POST', '/auth/totp/enable', { challenge, code });
    return r;
  },
  async confirmSession(user: PublicUser) { await finishLogin(user); },
  async logout() {
    try { await api('POST', '/auth/logout'); } catch { /* всё равно выходим */ }
    session = null; users = [];
    syncPolling();
    await refresh().catch(() => {});
    emit();
  },

  /* направления */
  directionsSorted(includeDrafts = false): Direction[] { return [...data.directions].filter((d) => includeDrafts || d.published).sort(byOrder); },
  async saveDirection(input: Direction): Promise<Direction> {
    const exists = data.directions.some((x) => x.id === input.id);
    const saved = exists ? await api<Direction>('PUT', `/admin/directions/${encodeURIComponent(input.id)}`, input) : await api<Direction>('POST', '/admin/directions', input);
    await refresh();
    return clone(saved);
  },
  async deleteDirection(id: string) { await api('DELETE', `/admin/directions/${encodeURIComponent(id)}`); await refresh(); },
  async reorderDirections(ids: string[]) { await api('POST', '/admin/directions-order', { ids }); await refresh(); },

  /* новости */
  async saveNews(input: NewsItem): Promise<NewsItem> {
    if (!input.title.ru.trim()) throw new Error('Укажите заголовок новости.');
    if (!input.date) throw new Error('Укажите дату.');
    const exists = data.news.some((x) => x.id === input.id);
    const saved = exists ? await api<NewsItem>('PUT', `/admin/news/${input.id}`, input) : await api<NewsItem>('POST', '/admin/news', input);
    await refresh();
    return saved;
  },
  async deleteNews(id: number) { await api('DELETE', `/admin/news/${id}`); await refresh(); },

  /* партнёры, настройки */
  async savePartners(list: Partner[]) { await api('PUT', '/admin/partners', list.map((p) => ({ ...p, name: p.name.trim() }))); await refresh(); },
  async saveSettings(s: Settings) { await api('PUT', '/admin/settings', s); await refresh(); },

  /* обращения */
  async submitInquiry(i: { name: string; phone: string; company: string; message: string; directionId: string | null; page: string; website?: string }) {
    await api('POST', '/inquiries', i);
  },
  async updateInquiry(id: string, status: InquiryStatus) { await api('PATCH', `/admin/inquiries/${id}`, { status }); await refresh(); },
  async deleteInquiry(id: string) { await api('DELETE', `/admin/inquiries/${id}`); await refresh(); },

  /* пользователи */
  async saveUser(u: { id?: string; login: string; name: string; role: Role; password: string; reset2fa?: boolean }) {
    if (!u.login.trim()) throw new Error('Укажите логин.');
    if (u.id) await api('PUT', `/admin/users/${u.id}`, u); else await api('POST', '/admin/users', u);
    if (session && u.id === session.id) { try { session = (await api<{ user: PublicUser }>('GET', '/auth/me')).user; } catch { /* */ } }
    await refresh();
  },
  async deleteUser(id: string) { await api('DELETE', `/admin/users/${id}`); await refresh(); },

  /* данные */
  exportData: () => api<SiteData>('GET', '/admin/data/export'),
  async importData(raw: unknown) { await api('POST', '/admin/data/import', raw); await refresh(); },
};
