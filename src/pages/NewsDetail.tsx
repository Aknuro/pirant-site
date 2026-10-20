import { Link, useParams } from 'react-router-dom';
import { assetUrl } from '../assetUrl';
import { useSite } from '../store/site';
import { useLang } from '../i18n/LanguageContext';
import { LOCALES } from '../components/NewsCard';
import NotFound from './NotFound';

export default function NewsDetail() {
  const { id } = useParams();
  const { l, t, lang } = useLang();
  const { news } = useSite();
  const n = news.find((x) => String(x.id) === id);
  if (!n) return <NotFound />;
  return (
    <article className="container-site max-w-3xl py-12">
      <Link to="/news" className="text-sm text-brand hover:underline">← {t('back')}</Link>
      <time className="mt-4 block text-sm text-ink/60">{new Date(n.date).toLocaleDateString(LOCALES[lang], { day: 'numeric', month: 'long', year: 'numeric' })}</time>
      <h1 className="mt-2 text-3xl font-extrabold text-navy">{l(n.title)}</h1>
      <img src={assetUrl(n.image)} alt="" className="mt-6 aspect-[16/9] w-full rounded-xl object-cover" />
      <p className="mt-6 text-lg leading-relaxed text-ink/80">{l(n.text)}</p>
    </article>
  );
}
