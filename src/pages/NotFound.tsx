import { Link } from 'react-router-dom';
import { useLang } from '../i18n/LanguageContext';

export default function NotFound() {
  const { t } = useLang();
  return (
    <div className="container-site py-24 text-center">
      <p className="text-6xl font-extrabold text-navy">404</p>
      <p className="mt-3 text-ink/70">{t('notFound')}</p>
      <Link to="/" className="btn-accent mt-6">{t('toHome')}</Link>
    </div>
  );
}
