import { MessageCircle } from 'lucide-react';
import { useLang } from '../../i18n/LanguageContext';
import { useLeadModal } from './LeadModalContext';

/** Круглая кнопка заявки — на всех страницах, справа внизу */
export default function FloatingLeadButton() {
  const { t } = useLang();
  const { open, openLead } = useLeadModal();
  if (open) return null;
  return (
    <button
      onClick={openLead}
      aria-label={t('leadTitle')}
      title={t('leadTitle')}
      className="fixed bottom-5 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-accent text-white shadow-lg shadow-navy/30 transition-transform hover:scale-105 hover:bg-accent-dark sm:bottom-6 sm:right-6"
    >
      <MessageCircle size={26} />
    </button>
  );
}
