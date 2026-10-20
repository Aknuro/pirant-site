import { useSite } from '../store/site';
import { useLang } from '../i18n/LanguageContext';
import Icon from './Icon';

export default function ProcessCycle() {
  const { t, tr } = useLang();
  const cycle = useSite().settings.cycle;
  if (!cycle.length) return null;
  return (
    <section className="py-14 lg:py-16">
      <div className="container-site">
        <h2 className="text-2xl font-extrabold text-navy sm:text-3xl">{t('cycleTitle')}</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {cycle.map((s, n) => (
            <li key={s.id} className="relative rounded-xl border border-navy/10 p-4">
              <span className="absolute right-3 top-3 text-xs font-bold text-accent-dark">{n + 1}</span>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-navy text-white"><Icon name={s.icon} size={20} /></span>
              <h3 className="mt-3 text-sm font-bold leading-snug text-navy">{tr(s.title)}</h3>
              <p className="mt-1 text-xs text-ink/65">{tr(s.text)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
