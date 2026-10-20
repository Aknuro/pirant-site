import { useLang } from '../i18n/LanguageContext';
import { useLeadModal } from './lead/LeadModalContext';

export default function CtaBand() {
  const { t } = useLang();
  const { openLead } = useLeadModal();
  return (
    <section className="bg-navy py-12 text-white">
      <div className="container-site flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-extrabold">{t('orderSolution')}</h2>
          <p className="mt-1 max-w-xl text-white/75">{t('orderText')}</p>
        </div>
        <button onClick={openLead} className="btn-accent shrink-0">{t('requestQuote')}</button>
      </div>
    </section>
  );
}
