import { useSearchParams } from 'react-router-dom';
import PageHead from '../components/PageHead';
import { assetUrl } from '../assetUrl';
import { useSite } from '../store/site';
import { useLang } from '../i18n/LanguageContext';
import type { ui } from '../i18n/ui';
import type { PartnerCategory } from '../types';

const cats: PartnerCategory[] = ['radio', 'security', 'servers', 'video', 'cuav'];

export default function Partners() {
  const { l, t } = useLang();
  const { partners } = useSite();
  const [params, setParams] = useSearchParams();
  const cat = params.get('cat') as PartnerCategory | null;
  const shown = cat ? partners.filter((p) => p.category === cat) : partners;
  const chip = (active: boolean) => `rounded-full border px-4 py-2 text-sm font-semibold ${active ? 'border-navy bg-navy text-white' : 'border-navy/20 text-navy hover:bg-brand-soft'}`;
  return (
    <>
      <PageHead title={t('partners')} sub={t('partnersSub')} />
      <div className="container-site py-10">
        <div className="flex flex-wrap gap-2" role="group">
          <button onClick={() => setParams({})} aria-pressed={!cat} className={chip(!cat)}>{t('all')}</button>
          {cats.map((c) => <button key={c} onClick={() => setParams({ cat: c })} aria-pressed={cat === c} className={chip(cat === c)}>{t(`cat_${c}` as keyof typeof ui)}</button>)}
        </div>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <li key={p.id} className="rounded-xl border border-navy/10 bg-white p-5">
              <div className="flex h-14 items-center text-xl font-extrabold text-navy">{p.logo ? <img src={assetUrl(p.logo)} alt={p.name} loading="lazy" className="max-h-12 max-w-[70%] object-contain" /> : p.name}</div>
              <span className="mt-2 inline-block rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">{t(`cat_${p.category}` as keyof typeof ui)}</span>
              <p className="mt-3 text-sm text-ink/70">{l(p.description)}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
