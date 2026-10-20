import { assetUrl } from '../../assetUrl';
import { useLang } from '../../i18n/LanguageContext';
import { useLeadModal } from '../lead/LeadModalContext';

export default function Hero() {
  const { t } = useLang();
  const { openLead } = useLeadModal();
  return (
    <section className="relative isolate flex min-h-[520px] items-center overflow-hidden bg-navy-900 text-white lg:min-h-[620px]">
      {/* Фон: фото + затемнение слева, чтобы текст читался, а справа картинка оставалась открытой */}
      <img src={assetUrl('/images/dc-corridor.webp')} alt="" fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-navy-900/70 lg:bg-gradient-to-r lg:from-navy-900/95 lg:via-navy-900/70 lg:to-navy-900/10" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-navy-900/60 to-transparent" />

      <div className="container-site py-20 lg:py-28">
        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">{t('heroTitle')}</h1>
        <p className="mt-5 max-w-lg text-base text-white/85 sm:text-lg">{t('heroSubtitle')}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={openLead} className="btn-accent">{t('contactUs')}</button>
          <a href="#services" className="btn-ghost">{t('viewServices')}</a>
        </div>
      </div>
    </section>
  );
}
