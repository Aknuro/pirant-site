import PageHead from '../components/PageHead';
import NewsCard from '../components/NewsCard';
import { useSite } from '../store/site';
import { useLang } from '../i18n/LanguageContext';

export default function News() {
  const { t } = useLang();
  const { news } = useSite();
  return (
    <>
      <PageHead title={t('newsTitle')} sub={t('newsSub')} />
      <div className="container-site grid gap-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {[...news].sort((a, b) => b.date.localeCompare(a.date)).map((n) => <NewsCard key={n.id} item={n} />)}
      </div>
    </>
  );
}
