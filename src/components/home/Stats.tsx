import { useSite } from '../../store/site';
import { useLang } from '../../i18n/LanguageContext';

export default function Stats() {
  const { l } = useLang();
  const stats = useSite().settings.stats;
  if (!stats.length) return null;
  return (
    <section className="border-b border-navy/10 bg-white">
      <dl className="container-site grid divide-x divide-navy/10 py-8" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
        {stats.map((s) => (
          <div key={s.id} className="px-2 text-center sm:px-6">
            <dt className="text-3xl font-extrabold text-navy sm:text-5xl">{s.value}</dt>
            <dd className="mt-1 text-xs text-ink/70 sm:text-sm">{l(s.label)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
