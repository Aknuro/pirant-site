import PageHead from '../components/PageHead';
import { useSite } from '../store/site';
import { useLang } from '../i18n/LanguageContext';

/** Таймлайн строится из записей news с showInHistory = true, сгруппированных по году */
export default function History() {
  const { l, t } = useLang();
  const { news } = useSite();
  const items = news.filter((n) => n.showInHistory).sort((a, b) => a.date.localeCompare(b.date));
  const years = [...new Set(items.map((n) => n.year))];
  return (
    <>
      <PageHead title={t('history')} sub={t('historySub')} />
      <div className="container-site py-14">
        <ol className="relative ml-3 border-l-2 border-brand/30 md:ml-0 md:border-l-0">
          {years.map((y) => (
            <li key={y} className="relative pb-10 pl-8 md:grid md:grid-cols-[120px_1fr] md:gap-8 md:pl-0">
              <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-white bg-accent md:hidden" />
              <p className="text-3xl font-extrabold text-accent-dark md:pt-3 md:text-right">{y}</p>
              <div className="space-y-4 md:border-l-2 md:border-brand/30 md:pl-8">
                {items.filter((n) => n.year === y).map((n) => (
                  <article key={n.id} className="grid overflow-hidden rounded-xl border border-navy/10 bg-white sm:grid-cols-[220px_1fr]">
                    <img src={n.image} alt="" loading="lazy" className="h-40 w-full object-cover sm:h-full" />
                    <div className="p-5"><h2 className="font-bold text-navy">{l(n.title)}</h2><p className="mt-2 text-sm text-ink/70">{l(n.text)}</p></div>
                  </article>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
