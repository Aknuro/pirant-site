import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { assetUrl } from '../assetUrl';
import { useLang } from '../i18n/LanguageContext';

export default function Gallery({ items }: { items: { src: string; caption: string }[] }) {
  const { t } = useLang();
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => {
    if (open === null) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open]);
  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((g, n) => (
          <button key={g.src} onClick={() => setOpen(n)} className="group overflow-hidden rounded-lg text-left">
            <img src={assetUrl(g.src)} alt={g.caption} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-105" />
            <span className="mt-1 block text-xs font-semibold text-navy">{g.caption}</span>
          </button>
        ))}
      </div>
      {open !== null && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-navy-900/90 p-4" onClick={() => setOpen(null)} role="dialog" aria-modal="true">
          <button aria-label={t('close')} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white"><X /></button>
          <figure onClick={(e) => e.stopPropagation()} className="max-h-full max-w-5xl">
            <img src={assetUrl(items[open].src)} alt={items[open].caption} className="max-h-[80vh] w-auto rounded-lg" />
            <figcaption className="mt-2 text-center text-sm text-white">{items[open].caption}</figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
