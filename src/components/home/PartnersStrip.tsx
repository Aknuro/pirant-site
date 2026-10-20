import { Link } from 'react-router-dom';
import { assetUrl } from '../../assetUrl';
import { useLang } from '../../i18n/LanguageContext';
import { useSite } from '../../store/site';

export default function PartnersStrip() {
  const { t } = useLang();
  const list = useSite().partners.filter((p) => p.featured);
  if (!list.length) return null;
  return (
    <section className="border-y border-navy/10 bg-white py-12">
      <div className="container-site">
        <h2 className="text-center text-xl font-bold text-navy">{t('partnersTitle')}</h2>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {list.map((p) => (
            <li key={p.id}>
              <Link to="/partners" className="flex h-20 items-center justify-center rounded-lg border border-navy/10 px-3 text-center font-extrabold text-navy/80 hover:border-brand hover:text-brand">
                {p.logo ? <img src={assetUrl(p.logo)} alt={p.name} loading="lazy" className="max-h-10 max-w-full object-contain" /> : p.name}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center"><Link to="/partners" className="text-sm font-semibold text-brand hover:underline">{t('allPartners')}</Link></p>
      </div>
    </section>
  );
}
