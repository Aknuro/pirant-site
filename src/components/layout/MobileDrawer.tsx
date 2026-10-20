import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, Phone, X } from 'lucide-react';
import { useContacts, useDirections } from '../../store/hooks';
import { useLang } from '../../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import { useLeadModal } from '../lead/LeadModalContext';
import Logo from './Logo';
import { navLinks } from './navLinks';

interface Props { open: boolean; onClose: () => void }

/** Боковое выезжающее меню для мобильной версии */
export default function MobileDrawer({ open, onClose }: Props) {
  const { l, t } = useLang();
  const { openLead } = useLeadModal();
  const contacts = useContacts();
  const services = useDirections();

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-navy-900/60 lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog" aria-modal="true" aria-label={t('menu')}
            className="fixed right-0 top-0 z-50 flex h-full w-[86%] max-w-sm flex-col overflow-y-auto bg-white p-5 lg:hidden"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
          >
            <div className="flex items-center justify-between">
              <Logo />
              <button onClick={onClose} aria-label={t('close')} className="rounded-lg p-2 hover:bg-brand-soft">
                <X />
              </button>
            </div>

            <nav className="mt-6 flex flex-col">
              {navLinks.filter((n) => n.to !== '/services').map((n) => (
                <Link key={n.to} to={n.to} onClick={onClose} className="border-b border-navy/10 py-3 font-semibold text-navy">
                  {t(n.key)}
                </Link>
              ))}
              <p className="mt-5 text-sm font-bold text-navy">{t('services')}</p>
              {services.map((s) => (
                <Link key={s.id} to={`/services/${s.id}`} onClick={onClose} className="py-2 pl-3 text-sm text-ink/80">
                  {l(s.title)}
                </Link>
              ))}
            </nav>

            <button onClick={() => { onClose(); openLead(); }} className="btn-accent mt-6">{t('requestQuote')}</button>

            <div className="mt-auto space-y-3 pt-8 text-sm">
              <LanguageSwitcher className="text-navy" />
              <a href={contacts.phoneHref} className="flex items-center gap-2 text-navy"><Phone size={16} /> {contacts.phone}</a>
              <a href={`mailto:${contacts.email}`} className="flex items-center gap-2 text-navy"><Mail size={16} /> {contacts.email}</a>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
