import { Mail, MapPin, Phone } from 'lucide-react';
import { useContacts } from '../../store/hooks';
import { useLang } from '../../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

/** Верхняя сервисная полоса — только на desktop */
export default function TopBar() {
  const { l } = useLang();
  const contacts = useContacts();
  const [first, second] = contacts.offices;
  return (
    <div className="hidden bg-navy-900 text-xs text-white/85 lg:block">
      <div className="container-site flex h-9 items-center justify-between">
        <div className="flex items-center gap-6">
          <a href={contacts.phoneHref} className="flex items-center gap-1.5 hover:text-white">
            <Phone size={13} /> {first && l(first.city)} {contacts.phone}
          </a>
          {second && (
            <span className="flex items-center gap-1.5">
              <MapPin size={13} /> {l(second.city)}
            </span>
          )}
          <a href={`mailto:${contacts.email}`} className="flex items-center gap-1.5 hover:text-white">
            <Mail size={13} /> {contacts.email}
          </a>
        </div>
        <LanguageSwitcher />
      </div>
    </div>
  );
}
