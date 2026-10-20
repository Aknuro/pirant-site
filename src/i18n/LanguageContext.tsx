import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { Lang, Localized } from '../types';
import { useSite } from '../store/site';
import { ui } from './ui';

type TextTranslator = (text: string) => string;

export const LANGS: Lang[] = ['ru', 'kk', 'en'];

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Выбирает строку нужного языка из объекта {ru, kk, en} */
  l: (text: Localized) => string;
  /** Переводит встроенный публичный текст, включая контент без языковых полей */
  tr: (text: string) => string;
  /** Строка интерфейса по ключу из ui.ts */
  t: (key: keyof typeof ui) => string;
}

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('lang') as Lang) || 'ru');
  const [translate, setTranslate] = useState<TextTranslator>(() => (text: string) => text);
  const { pathname } = useLocation();

  useEffect(() => {
    if (lang === 'ru') {
      setTranslate(() => (text: string) => text);
      return;
    }
    let active = true;
    void import('./content').then(({ translateContent }) => {
      if (active) setTranslate(() => (text: string) => translateContent(text, lang));
    }).catch((error: unknown) => {
      console.error('Не удалось загрузить переводы сайта:', error);
    });
    return () => { active = false; };
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
    const isAdmin = pathname.startsWith('/admin');
    document.documentElement.lang = isAdmin ? 'ru' : lang;
    if (!isAdmin) {
      const title = {
        ru: 'PIRANT Kazakhstan — Связь. Безопасность. Инфраструктура',
        kk: 'PIRANT Kazakhstan — Байланыс. Қауіпсіздік. Инфрақұрылым',
        en: 'PIRANT Kazakhstan — Communication. Security. Infrastructure',
      } satisfies Record<Lang, string>;
      document.title = title[lang];
    }
  }, [lang, pathname]);

  const { settings } = useSite();
  const tr = useCallback((text: string) => translate(text), [translate]);
  const l = useCallback((text: Localized) => text[lang] || tr(text.ru), [lang, tr]);
  // Тексты, отредактированные в панели управления, перекрывают значения по умолчанию из ui.ts (по языкам)
  const t = useCallback((key: keyof typeof ui) => {
    const o = (settings.texts as Record<string, Localized | undefined>)[key];
    if (!o) return l(ui[key]);
    const merged = { ...ui[key], ...Object.fromEntries(Object.entries(o).filter(([, v]) => v && String(v).trim())) } as Localized;
    return l(merged);
  }, [l, settings.texts]);
  const value = useMemo(() => ({ lang, setLang, l, tr, t }), [lang, l, tr, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider');
  return ctx;
}
