import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import type { Step } from '../data/servicesContent';

/** Пошаговая интерактивная схема: вертикальный список на мобильных, горизонтальные шаги на десктопе */
export default function Scheme({ title, steps }: { title: string; steps: Step[] }) {
  const { t } = useLang();
  const [i, setI] = useState(0);
  const cur = steps[i];
  const panel = (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold text-accent-dark">{t('step')} {i + 1} / {steps.length}</p>
      <h3 className="mt-1 text-xl font-bold text-navy">{cur.title}</h3>
      <p className="mt-2 text-ink/75">{cur.text}</p>
      <div className="mt-4 flex gap-2">
        <button onClick={() => setI(i - 1)} disabled={i === 0} className="btn-outline !px-3 !py-2 disabled:opacity-40"><ChevronLeft size={16} />{t('prev')}</button>
        <button onClick={() => setI(i + 1)} disabled={i === steps.length - 1} className="btn-outline !px-3 !py-2 disabled:opacity-40">{t('next')}<ChevronRight size={16} /></button>
      </div>
    </div>
  );
  return (
    <section className="bg-brand-soft py-14">
      <div className="container-site">
        <h2 className="text-2xl font-extrabold text-navy sm:text-3xl">{title}</h2>
        <ol className="mt-8 flex flex-col gap-2 lg:flex-row lg:gap-0">
          {steps.map((s, n) => (
            <li key={s.title} className="flex-1">
              <button
                onClick={() => setI(n)} aria-current={n === i ? 'step' : undefined}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left lg:flex-col lg:text-center"
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold ${n === i ? 'bg-accent text-white' : n < i ? 'bg-navy text-white' : 'bg-white text-navy'}`}>{n + 1}</span>
                <span className={`text-sm font-semibold ${n === i ? 'text-navy' : 'text-ink/60'}`}>{s.title}</span>
              </button>
              {n === i && <div className="mt-2 lg:hidden">{panel}</div>}
            </li>
          ))}
        </ol>
        <div className="mt-6 hidden lg:block">{panel}</div>
      </div>
    </section>
  );
}
