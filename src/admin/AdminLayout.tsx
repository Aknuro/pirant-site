import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Building2, ExternalLink, Handshake, Inbox, LayoutDashboard, LayoutGrid, LogOut, Menu, Newspaper, Phone, Plus, Search, Users, Database, Bell, X } from 'lucide-react';
import Logo from '../components/layout/Logo';
import { norm } from '../store/utils';
import { store, useSession, useSite } from '../store/site';
import type { Role } from '../types';
import { GLink, useConfirm, useDirtyCtx, useGuardedNavigate } from './ui';

export const ROLE_NAMES: Record<Role, string> = { superadmin: 'Суперадминистратор', manager: 'Менеджер контента' };
const ALL: Role[] = ['superadmin', 'manager'];

const NAV: ({ to: string; title: string; icon: typeof Menu; roles: Role[]; end?: boolean; badge?: boolean } | { group: string; roles: Role[] })[] = [
  { to: '/admin', title: 'Обзор', icon: LayoutDashboard, roles: ALL, end: true },
  { to: '/admin/directions', title: 'Направления', icon: LayoutGrid, roles: ALL },
  { to: '/admin/news', title: 'Новости и история', icon: Newspaper, roles: ALL },
  { to: '/admin/inquiries', title: 'Обращения', icon: Inbox, roles: ALL, badge: true },
  { group: 'Сайт', roles: ['superadmin'] },
  { to: '/admin/company', title: 'О компании', icon: Building2, roles: ['superadmin'] },
  { to: '/admin/contacts', title: 'Контакты и мессенджеры', icon: Phone, roles: ['superadmin'] },
  { to: '/admin/partners', title: 'Партнёры', icon: Handshake, roles: ['superadmin'] },
  { group: 'Управление', roles: ['superadmin'] },
  { to: '/admin/users', title: 'Пользователи', icon: Users, roles: ['superadmin'] },
  { to: '/admin/notifications', title: 'Уведомления', icon: Bell, roles: ['superadmin'] },
  { to: '/admin/data', title: 'Данные и копии', icon: Database, roles: ['superadmin'] },
];

/** Доступ к разделам по ролям (используется и для защиты маршрутов) */
export const SECTION_ROLES: Record<string, Role[]> = { company: ['superadmin'], contacts: ['superadmin'], partners: ['superadmin'], users: ['superadmin'], notifications: ['superadmin'], data: ['superadmin'] };

function AdminSearch() {
  const { directions, news } = useSite();
  const go = useGuardedNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const results = useMemo(() => {
    const n = norm(q);
    if (n.length < 2) return [];
    const words = n.split(' ');
    const hit = (s: string) => words.every((w) => norm(s).includes(w));
    return [
      ...directions.filter((d) => hit([d.title.ru, d.title.en ?? '', d.id, d.tagline, d.description.ru, ...d.blocks.flatMap((b) => [b.title, ...b.items.map((i) => i.title)])].join(' ')))
        .slice(0, 6).map((d) => ({ key: `d-${d.id}`, to: `/admin/directions/${d.id}`, title: d.title.ru, meta: d.published ? 'Направление' : 'Направление · черновик' })),
      ...news.filter((x) => hit(`${x.title.ru} ${x.title.en ?? ''} ${x.date}`)).slice(0, 4).map((x) => ({ key: `n-${x.id}`, to: `/admin/news/${x.id}`, title: x.title.ru, meta: 'Новость' })),
    ];
  }, [q, directions, news]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={box} className="relative min-w-0 flex-1 sm:max-w-md">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy/45" />
      <input
        type="search" value={q} placeholder="Поиск: направление, раздел, новость…" aria-label="Поиск по направлениям и новостям"
        onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); if (e.key === 'Enter' && results[0]) { setOpen(false); setQ(''); void go(results[0].to); } }}
        className="adm-input !pl-9"
      />
      {open && norm(q).length >= 2 && (
        <ul className="absolute left-0 right-0 top-full z-40 mt-1 max-h-80 overflow-y-auto rounded-xl border border-navy/10 bg-white p-1 shadow-xl">
          {results.length === 0 && <li className="px-3 py-3 text-sm text-ink/60">Ничего не найдено по запросу «{q}».</li>}
          {results.map((r) => (
            <li key={r.key}>
              <button type="button" onClick={() => { setOpen(false); setQ(''); void go(r.to); }} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-brand-soft">
                <span className="block text-sm font-semibold text-navy">{r.title}</span><span className="text-xs text-ink/55">{r.meta}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminLayout() {
  const me = useSession()!;
  const { inquiries } = useSite();
  const confirm = useConfirm();
  const { dirty, setDirty } = useDirtyCtx();
  const go = useGuardedNavigate();
  const [menu, setMenu] = useState(false);
  const { pathname } = useLocation();
  const main = useRef<HTMLElement>(null);
  const fresh = inquiries.filter((i) => i.status === 'new').length;

  useEffect(() => { setMenu(false); window.scrollTo(0, 0); main.current?.focus({ preventScroll: true }); }, [pathname]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  const logout = async () => {
    if (dirty && !(await confirm({ title: 'Выйти без сохранения?', text: 'Несохранённые изменения будут потеряны.', ok: 'Выйти', danger: true }))) return;
    setDirty(false);
    store.logout();
  };

  return (
    <div className="min-h-screen bg-[#F4F6FC] text-ink">
      <a href="#admin-content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Перейти к содержанию</a>

      {/* Боковое меню */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-navy-900 text-white transition-transform lg:translate-x-0 ${menu ? 'translate-x-0' : '-translate-x-full'}`} aria-label="Меню панели управления">
        <div className="flex items-center justify-between px-5 pb-4 pt-5">
          <div>
            <Logo light />
            <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-accent">Панель управления</p>
          </div>
          <button className="rounded-lg p-2 hover:bg-white/10 lg:hidden" onClick={() => setMenu(false)} aria-label="Закрыть меню"><X size={20} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Разделы панели">
          <ul className="space-y-0.5">
            {NAV.filter((n) => n.roles.includes(me.role)).map((n, i) => 'group' in n ? (
              <li key={i} className="px-3 pb-1 pt-5 text-[11px] font-bold uppercase tracking-wider text-white/40">{n.group}</li>
            ) : (
              <li key={n.to}>
                <NavLink to={n.to} end={n.end} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${isActive ? 'bg-white text-navy' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                  onClick={(e) => { if (dirty) { e.preventDefault(); void go(n.to); } }}>
                  <n.icon size={18} /><span className="flex-1">{n.title}</span>
                  {n.badge && fresh > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-white" aria-label={`${fresh} новых`}>{fresh}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-2 border-t border-white/10 p-4">
          <div className="px-1"><b className="block text-sm">{me.name}</b><small className="text-xs text-white/55">{ROLE_NAMES[me.role]} · {me.login}</small></div>
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"><ExternalLink size={16} />Открыть сайт</a>
          <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"><LogOut size={16} />Выйти</button>
        </div>
      </aside>
      {menu && <button aria-label="Закрыть меню" className="fixed inset-0 z-40 bg-navy-900/50 lg:hidden" onClick={() => setMenu(false)} />}

      {/* Основная часть */}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-navy/10 bg-white/95 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <button className="icon-btn lg:hidden" onClick={() => setMenu(true)} aria-label="Открыть меню" aria-expanded={menu}><Menu size={20} /></button>
            <AdminSearch />
            <GLink to="/admin/directions/new" className="btn-accent ml-auto hidden shrink-0 !py-2.5 sm:inline-flex"><Plus size={16} />Добавить направление</GLink>
          </div>
        </header>
        <main id="admin-content" ref={main} tabIndex={-1} className="px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8"><Outlet /></main>
      </div>
    </div>
  );
}

