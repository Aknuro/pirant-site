import { Link } from 'react-router-dom';
import { useSite } from '../../store/site';
import { useLang } from '../../i18n/LanguageContext';
import NewsCard from '../NewsCard';

export default function NewsSection() {
  const { t } = useLang();
  const { news } = useSite();
  const latest = [...news].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  return (
    <section className="py-16 lg:py-20">
      <div className="container-site">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl font-extrabold text-navy">{t('newsTitle')}</h2>
          <Link to="/news" className="btn-outline hidden sm:inline-flex">{t('allNews')}</Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{latest.map((n) => <NewsCard key={n.id} item={n} />)}</div>
        <Link to="/news" className="btn-outline mt-6 w-full sm:hidden">{t('allNews')}</Link>
      </div>
    </section>
  );
}
