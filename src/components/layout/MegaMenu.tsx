import { Link } from 'react-router-dom';
import { useDirections } from '../../store/hooks';
import { useLang } from '../../i18n/LanguageContext';
import ServiceIcon from '../ServiceIcon';

/** Содержимое выпадающего мега-меню «Направления» */
export default function MegaMenu({ onNavigate }: { onNavigate: () => void }) {
  const { l } = useLang();
  const services = useDirections();
  return (
    <div className="absolute left-0 right-0 top-full border-t border-navy/10 bg-white shadow-xl">
      <div className="container-site grid grid-cols-3 gap-2 py-6">
        {services.map((s) => (
          <Link
            key={s.id}
            to={`/services/${s.id}`}
            onClick={onNavigate}
            className="flex gap-3 rounded-lg p-3 hover:bg-brand-soft"
          >
            <ServiceIcon name={s.icon} className="mt-0.5 shrink-0 text-brand" size={22} />
            <span>
              <span className="block text-sm font-bold text-navy">{l(s.title)}</span>
              <span className="mt-1 line-clamp-2 block text-xs text-ink/65">{l(s.description)}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
