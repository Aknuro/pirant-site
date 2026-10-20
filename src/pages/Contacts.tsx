import { useState } from 'react';
import { Clock, Globe, Mail, MapPin, MessageCircle, Navigation, Phone } from 'lucide-react';
import PageHead from '../components/PageHead';
import { useLang } from '../i18n/LanguageContext';
import { telHref, useContacts, waUrl } from '../store/hooks';

export default function Contacts() {
  const { l, t, tr } = useLang();
  const c = useContacts();
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = c.offices.find((o) => o.id === activeId) ?? c.offices[0];
  const row = 'flex items-center gap-3 text-sm text-navy hover:text-brand';
  return (
    <>
      <PageHead title={t('contacts')} sub={t('contactsSub')} />
      <div className="container-site grid gap-8 py-12 lg:grid-cols-[400px_1fr]">
        <div className="space-y-4">
          {c.offices.map((o) => (
            <article key={o.id} className={`rounded-xl border p-5 ${active?.id === o.id ? 'border-brand bg-brand-soft' : 'border-navy/10'}`}>
              <button onClick={() => setActiveId(o.id)} className="flex w-full items-start gap-3 text-left">
                <MapPin className="mt-1 shrink-0 text-accent" size={20} />
                <span><b className="block text-lg text-navy">{l(o.city)}</b><span className="text-sm text-ink/75">{tr(o.address)}</span></span>
              </button>
              {o.phone && <a href={telHref(o.phone)} className="mt-2 block pl-8 text-sm font-semibold text-navy hover:text-brand">{o.phone}</a>}
              <a className="btn-outline mt-3 !py-2 !text-xs" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(tr(o.mapQuery))}`}><Navigation size={14} />{t('route')}</a>
            </article>
          ))}
          <div className="space-y-3 rounded-xl border border-navy/10 p-5">
            {c.phones.map((p) => <a key={p.id} href={telHref(p.number)} className={row}><Phone size={18} />{p.number}<span className="text-xs text-ink/50">{tr(p.label)}</span></a>)}
            {c.whatsapp && <a href={waUrl(c.whatsapp)} target="_blank" rel="noreferrer" className={row}><MessageCircle size={18} />{t('writeWhatsapp')}</a>}
            <a href={`mailto:${c.email}`} className={row}><Mail size={18} />{c.email}</a>
            {c.site && <a href={c.site} target="_blank" rel="noreferrer" className={row}><Globe size={18} />{c.site.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>}
            {c.workHours && <p className="flex items-center gap-3 text-sm text-navy"><Clock size={18} />{c.workHours}</p>}
          </div>
          <p className="text-sm font-semibold text-navy">{t('slogan')}</p>
        </div>
        {active && (
          <iframe
            key={active.id} title={l(active.city)} loading="lazy"
            src={`https://www.google.com/maps?q=${encodeURIComponent(active.mapQuery)}&output=embed`}
            className="h-[380px] w-full rounded-xl border border-navy/10 lg:h-full lg:min-h-[480px]"
          />
        )}
      </div>
    </>
  );
}
