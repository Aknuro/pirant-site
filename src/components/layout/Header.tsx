import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, Phone } from 'lucide-react';
import { useContacts } from '../../store/hooks';
import { useLang } from '../../i18n/LanguageContext';
import { useLeadModal } from '../lead/LeadModalContext';
import Logo from './Logo';
import MegaMenu from './MegaMenu';
import MobileDrawer from './MobileDrawer';
import TopBar from './TopBar';
import { navLinks } from './navLinks';

export default function Header() {
  const { t } = useLang();
  const contacts = useContacts();
  const { openLead } = useLeadModal();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const { pathname } = useLocation();

  // закрываем меню при смене страницы
  useEffect(() => { setDrawerOpen(false); setMegaOpen(false); }, [pathname]);

  return (
    <>
      <TopBar />
      <header className="sticky top-0 z-30 border-b border-navy/10 bg-white/95 backdrop-blur" onMouseLeave={() => setMegaOpen(false)}>
        <div className="container-site flex h-16 items-center justify-between lg:h-[72px]">
          <Logo />

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-7 lg:flex" aria-label={t('mainNavigation')}>
            {navLinks.map((n) =>
              n.to === '/services' ? (
                <button
                  key={n.to}
                  onMouseEnter={() => setMegaOpen(true)}
                  onClick={() => setMegaOpen((v) => !v)}
                  aria-expanded={megaOpen}
                  className="flex items-center gap-1 text-sm font-semibold text-navy hover:text-brand"
                >
                  {t(n.key)} <ChevronDown size={15} className={`transition-transform ${megaOpen ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <NavLink
                  key={n.to} to={n.to}
                  onMouseEnter={() => setMegaOpen(false)}
                  className={({ isActive }) => `text-sm font-semibold hover:text-brand ${isActive ? 'text-brand' : 'text-navy'}`}
                >
                  {t(n.key)}
                </NavLink>
              )
            )}
            <button onClick={openLead} className="btn-accent !py-2.5">{t('requestQuote')}</button>
          </nav>

          {/* Mobile: быстрый вызов + бургер */}
          <div className="flex items-center gap-2 lg:hidden">
            <a href={contacts.phoneHref} aria-label={t('call')} className="rounded-lg bg-accent p-2.5 text-white">
              <Phone size={18} />
            </a>
            <button onClick={() => setDrawerOpen(true)} aria-label={t('menu')} className="rounded-lg p-2.5 text-navy hover:bg-brand-soft">
              <Menu size={22} />
            </button>
          </div>
        </div>

        {megaOpen && <div className="hidden lg:block"><MegaMenu onNavigate={() => setMegaOpen(false)} /></div>}
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
