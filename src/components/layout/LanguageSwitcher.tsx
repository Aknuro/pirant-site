import { LANGS, useLang } from '../../i18n/LanguageContext';

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useLang();
  return (
    <div className={`flex items-center gap-1 ${className}`} role="group" aria-label={t('languageGroup')}>
      {LANGS.map((code, i) => (
        <span key={code} className="flex items-center gap-1">
          {i > 0 && <span className="text-current opacity-30">|</span>}
          <button
            onClick={() => setLang(code)}
            aria-pressed={lang === code}
            className={`rounded px-1 text-xs font-bold uppercase ${lang === code ? 'text-accent' : 'opacity-70 hover:opacity-100'}`}
          >
            {code}
          </button>
        </span>
      ))}
    </div>
  );
}
