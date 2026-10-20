import { useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMatch } from 'react-router-dom';
import { X } from 'lucide-react';
import { useLang } from '../../i18n/LanguageContext';
import { useDirections } from '../../store/hooks';
import { store } from '../../store/site';
import { useLeadModal } from './LeadModalContext';

const field = 'mt-1 w-full rounded-lg border border-navy/20 bg-white px-4 py-3 text-sm font-normal outline-none focus:border-brand';

export default function LeadModal() {
  const { open, closeLead } = useLeadModal();
  const { l, t } = useLang();
  const services = useDirections();
  const match = useMatch('/services/:id');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) { setSent(false); setError(''); return; }
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeLead();
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open, closeLead]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setBusy(true); setError('');
    try {
      // заявка сохраняется только на сервере компании; сотрудники получают уведомление без данных заявки
      await store.submitInquiry({
        name: d.name, phone: d.phone, company: d.company ?? '', message: d.message ?? '',
        directionId: d.service_id || null, page: window.location.pathname, website: d.website ?? '',
      });
      setSent(true);
    } catch (ex) { setError((ex as Error).message); } finally { setBusy(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] overflow-y-auto bg-navy-900/60 backdrop-blur-md"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && closeLead()}
        >
          <div className="flex min-h-full items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && closeLead()}>
            <motion.div
              role="dialog" aria-modal="true" aria-labelledby="lead-title"
              className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
              initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <button onClick={closeLead} aria-label={t('close')} className="absolute right-4 top-4 rounded-lg p-2 text-navy hover:bg-brand-soft">
                <X size={20} />
              </button>

              <h2 id="lead-title" className="pr-10 text-2xl font-extrabold text-navy">{t('leadTitle')}</h2>
              <p className="mt-2 text-sm text-ink/70">{t('formSubtitle')}</p>

              {sent ? (
                <div role="status" className="mt-6 rounded-lg bg-brand-soft p-4 text-sm font-semibold text-navy">
                  {t('sent')}
                  <button onClick={closeLead} className="btn-outline mt-4 w-full">{t('close')}</button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="mt-6 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-semibold">{t('name')}
                    <input name="name" required autoComplete="name" className={field} />
                  </label>
                  <label className="text-sm font-semibold">{t('phone')}
                    <input name="phone" type="tel" required autoComplete="tel" placeholder="+7" className={field} />
                  </label>
                  <label className="text-sm font-semibold">{t('company')}
                    <input name="company" autoComplete="organization" className={field} />
                  </label>
                  <label className="text-sm font-semibold">{t('direction')}
                    <select name="service_id" defaultValue={match?.params.id ?? ''} className={field}>
                      <option value="">—</option>
                      {services.map((s) => <option key={s.id} value={s.id}>{l(s.title)}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-semibold sm:col-span-2">{t('message')}
                    <textarea name="message" rows={3} className={field} />
                  </label>
                  {/* ловушка для ботов: людям не видна */}
                  <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
                  {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 sm:col-span-2">{error}</div>}
                  <button type="submit" disabled={busy} className="btn-accent disabled:opacity-60 sm:col-span-2">{busy ? '…' : t('send')}</button>
                </form>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
