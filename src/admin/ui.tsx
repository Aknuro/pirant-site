import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes,
} from 'react';
import { Link, useNavigate, type LinkProps } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, ImagePlus, Plus, Trash2, Upload, X } from 'lucide-react';
import Icon, { iconList } from '../components/Icon';
import type { Localized } from '../types';
import { processImage, type UploadedImage } from '../store/utils';
import { assetUrl } from '../assetUrl';

/* ================================================================== Тосты */
type ToastKind = 'success' | 'error';
const ToastCtx = createContext<(msg: string, kind?: ToastKind) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string; kind: ToastKind }[]>([]);
  const push = useCallback((msg: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { id, msg, kind }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), kind === 'error' ? 7000 : 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[90] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2" role="status" aria-live="polite">
        {items.map((i) => (
          <div key={i.id} className={`pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${i.kind === 'error' ? 'bg-red-700' : 'bg-navy'}`}>
            {i.kind === 'error' ? <AlertTriangle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-accent" />}
            <span>{i.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ================================================================== Подтверждение */
interface ConfirmOpts { title: string; text?: string; ok?: string; cancel?: string; danger?: boolean }
const ConfirmCtx = createContext<(o: ConfirmOpts) => Promise<boolean>>(async () => false);
export const useConfirm = () => useContext(ConfirmCtx);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setState({ ...o, resolve })), []);
  const done = (v: boolean) => { state?.resolve(v); setState(null); };
  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state && (
        <Modal title={state.title} onClose={() => done(false)} size="sm"
          footer={<>
            <button className="btn-outline" onClick={() => done(false)}>{state.cancel ?? 'Отмена'}</button>
            <button className={state.danger ? 'btn bg-red-700 text-white hover:bg-red-800' : 'btn-accent'} onClick={() => done(true)} autoFocus={!state.danger}>{state.ok ?? 'Подтвердить'}</button>
          </>}>
          {state.text && <p className="text-sm text-ink/80">{state.text}</p>}
        </Modal>
      )}
    </ConfirmCtx.Provider>
  );
}

/* ================================================================== Модальное окно */
export function Modal({ title, onClose, children, footer, size = 'md' }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-navy-900/60 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`w-full ${size === 'sm' ? 'max-w-md' : 'max-w-xl'} rounded-2xl bg-white shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <h2 className="text-lg font-extrabold text-navy">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Закрыть"><X size={18} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-navy/10 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/* ================================================================== Несохранённые изменения */
const DirtyCtx = createContext<{ dirty: boolean; setDirty: (v: boolean) => void }>({ dirty: false, setDirty: () => {} });
export const useDirtyCtx = () => useContext(DirtyCtx);

export function DirtyProvider({ children }: { children: ReactNode }) {
  const [dirty, setDirtyState] = useState(false);
  const setDirty = useCallback((v: boolean) => setDirtyState(v), []);
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);
  return <DirtyCtx.Provider value={useMemo(() => ({ dirty, setDirty }), [dirty, setDirty])}>{children}</DirtyCtx.Provider>;
}

/** navigate() с вопросом, если на странице есть несохранённые изменения */
export function useGuardedNavigate() {
  const nav = useNavigate();
  const { dirty, setDirty } = useDirtyCtx();
  const confirm = useConfirm();
  return useCallback(async (to: string) => {
    if (dirty) {
      const leave = await confirm({ title: 'Уйти без сохранения?', text: 'На этой странице есть несохранённые изменения.', ok: 'Уйти без сохранения', cancel: 'Остаться', danger: true });
      if (!leave) return;
      setDirty(false);
    }
    nav(to);
  }, [dirty, setDirty, confirm, nav]);
}

/** Ссылка с защитой от потери несохранённых изменений */
export function GLink({ to, children, onClick, ...rest }: LinkProps & { to: string }) {
  const go = useGuardedNavigate();
  const { dirty } = useDirtyCtx();
  if (!dirty) return <Link to={to} onClick={onClick} {...rest}>{children}</Link>;
  return <Link to={to} {...rest} onClick={(e) => { e.preventDefault(); onClick?.(e); void go(to); }}>{children}</Link>;
}

/** Черновик редактируемого объекта: dirty выставляется только после реального изменения */
export function useDraft<T>(initial: T) {
  const [draft, setDraft] = useState<T>(initial);
  const [touched, setTouched] = useState(false);
  const { setDirty } = useDirtyCtx();
  useEffect(() => { setDirty(touched); }, [touched, setDirty]);
  useEffect(() => () => setDirty(false), [setDirty]);
  const update = useCallback((fn: (d: T) => T) => { setDraft((d) => fn(d)); setTouched(true); }, []);
  const reset = useCallback((next: T) => { setDraft(next); setTouched(false); }, []);
  return { draft, update, reset, dirty: touched };
}

/* ================================================================== Базовые элементы */
export function PageTitle({ title, desc, actions }: { title: string; desc?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">{title}</h1>
        {desc && <p className="mt-1 max-w-2xl text-sm text-ink/65">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, desc, actions, children, className = '' }: { title?: string; desc?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-lg font-extrabold text-navy">{title}</h2>}
            {desc && <p className="mt-0.5 text-sm text-ink/60">{desc}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Field({ label, hint, error, children, span, htmlFor }: { label: string; hint?: ReactNode; error?: string; children: ReactNode; span?: boolean; htmlFor?: string }) {
  return (
    <div className={span ? 'sm:col-span-2' : ''}>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-semibold text-navy">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink/55">{hint}</p>}
      {error && <p className="mt-1 text-xs font-semibold text-red-700" role="alert">{error}</p>}
    </div>
  );
}
export const FormGrid = ({ children }: { children: ReactNode }) => <div className="grid gap-4 sm:grid-cols-2">{children}</div>;

export function TextInput(p: InputHTMLAttributes<HTMLInputElement>) { return <input {...p} className={`adm-input ${p.className ?? ''}`} />; }
export function TextArea(p: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea rows={3} {...p} className={`adm-input min-h-[44px] ${p.className ?? ''}`} />; }
export function Select(p: SelectHTMLAttributes<HTMLSelectElement>) { return <select {...p} className={`adm-input ${p.className ?? ''}`} />; }

export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-navy/10 bg-brand-soft/50 px-4 py-3">
      <span><b className="block text-sm text-navy">{label}</b>{hint && <small className="text-xs text-ink/60">{hint}</small>}</span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span aria-hidden className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-navy/25'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </label>
  );
}

const tones = {
  ok: 'bg-emerald-50 text-emerald-800', draft: 'bg-navy/10 text-navy', new: 'bg-accent/15 text-accent-dark', work: 'bg-brand-soft text-brand',
  done: 'bg-emerald-50 text-emerald-800', wa: 'bg-green-50 text-green-800', tg: 'bg-sky-50 text-sky-800',
} as const;
export function Pill({ tone = 'draft', children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}

export function EmptyState({ children }: { children: ReactNode }) { return <p className="rounded-xl border border-dashed border-navy/20 p-6 text-center text-sm text-ink/60">{children}</p>; }

/** Липкая панель сохранения внизу страницы */
export function SaveBar({ dirty, saving, onSave, children, label = 'Сохранить', stateText }: { dirty: boolean; saving?: boolean; onSave?: () => void; children?: ReactNode; label?: string; stateText?: string }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-navy/10 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <span className={`text-sm font-semibold ${dirty ? 'text-accent-dark' : 'text-ink/55'}`} role="status" aria-live="polite">
        {stateText ?? (dirty ? 'Есть несохранённые изменения' : 'Все изменения сохранены')}
      </span>
      <div className="flex flex-wrap gap-2">
        {children}
        <button type="submit" onClick={onSave} disabled={saving} className="btn-accent disabled:opacity-60">{saving ? 'Сохраняем…' : label}</button>
      </div>
    </div>
  );
}

/* ================================================================== Иконка */
export function IconSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-navy text-white"><Icon name={value || 'check'} size={18} /></span>
      <Select value={value || 'check'} onChange={(e) => onChange(e.target.value)} aria-label={label ?? 'Иконка'}>
        {iconList.map((i) => <option key={i.name} value={i.name}>{i.label}</option>)}
      </Select>
    </div>
  );
}

/* ================================================================== Многоязычное поле */
const LANGS = [['ru', 'RU'], ['kk', 'ҚАЗ'], ['en', 'EN']] as const;
export function LocalizedField({ label, value, onChange, multiline, rows = 3, hint, placeholder }: {
  label: string; value: Localized; onChange: (v: Localized) => void; multiline?: boolean; rows?: number; hint?: ReactNode; placeholder?: string;
}) {
  const [lang, setLang] = useState<'ru' | 'kk' | 'en'>('ru');
  const cur = value[lang] ?? '';
  const set = (v: string) => onChange({ ...value, [lang]: v });
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-navy">{label}</span>
        <div className="flex gap-1" role="tablist" aria-label={`Язык: ${label}`}>
          {LANGS.map(([k, name]) => (
            <button key={k} type="button" role="tab" aria-selected={lang === k} onClick={() => setLang(k)}
              className={`relative rounded-md px-2 py-1 text-[11px] font-bold ${lang === k ? 'bg-navy text-white' : 'bg-brand-soft text-navy hover:bg-navy/10'}`}>
              {name}{k !== 'ru' && (value[k] ?? '').trim() && <span aria-hidden className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent" />}
            </button>
          ))}
        </div>
      </div>
      {multiline
        ? <TextArea rows={rows} value={cur} onChange={(e) => set(e.target.value)} placeholder={lang === 'ru' ? placeholder : `Перевод (если пусто — показывается русский)`} />
        : <TextInput value={cur} onChange={(e) => set(e.target.value)} placeholder={lang === 'ru' ? placeholder : `Перевод (если пусто — показывается русский)`} />}
      {hint && <p className="mt-1 text-xs text-ink/55">{hint}</p>}
    </div>
  );
}

/* ================================================================== Список строк с сортировкой */
export function RowsEditor<T>({ rows, onChange, blank, addText, render, empty }: {
  rows: T[]; onChange: (rows: T[]) => void; blank: () => T; addText: string;
  render: (row: T, index: number, set: (patch: Partial<T>) => void) => ReactNode; empty?: string;
}) {
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= rows.length) return; const n = [...rows]; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
  return (
    <div className="space-y-3">
      {rows.length === 0 && empty && <EmptyState>{empty}</EmptyState>}
      {rows.map((row, i) => (
        <div key={i} className="flex items-start gap-3 rounded-xl border border-navy/10 bg-white p-3">
          <div className="min-w-0 flex-1">{render(row, i, (patch) => onChange(rows.map((r, k) => (k === i ? { ...r, ...patch } : r))))}</div>
          <div className="flex shrink-0 gap-1">
            <button type="button" className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Строка ${i + 1} выше`}><ChevronUp size={16} /></button>
            <button type="button" className="icon-btn" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label={`Строка ${i + 1} ниже`}><ChevronDown size={16} /></button>
            <button type="button" className="icon-btn icon-btn-danger" onClick={() => onChange(rows.filter((_, k) => k !== i))} aria-label={`Удалить строку ${i + 1}`}><Trash2 size={16} /></button>
          </div>
        </div>
      ))}
      <button type="button" className="btn-outline btn-sm" onClick={() => onChange([...rows, blank()])}><Plus size={14} />{addText}</button>
    </div>
  );
}

/* ================================================================== Изображения */
export function useImageUpload() {
  const toast = useToast();
  return useCallback(async (files: FileList | File[] | null): Promise<UploadedImage[]> => {
    const out: UploadedImage[] = [];
    for (const f of Array.from(files ?? [])) {
      try { out.push(await processImage(f)); } catch (e) { toast((e as Error).message, 'error'); }
    }
    return out;
  }, [toast]);
}

/** Одна картинка: предпросмотр, загрузка, удаление */
export function ImageField({ label, value, onChange, hint, aspect = 'aspect-[16/10]' }: { label: string; value: string; onChange: (src: string) => void; hint?: string; aspect?: string }) {
  const upload = useImageUpload();
  const input = useRef<HTMLInputElement>(null);
  return (
    <div>
      <span className="mb-1 block text-sm font-semibold text-navy">{label}</span>
      <div className="flex items-start gap-3">
        <div className={`grid w-36 shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed border-navy/25 bg-brand-soft/60 ${aspect}`}>
          {value ? <img src={assetUrl(value)} alt="" className="h-full w-full object-cover" /> : <ImagePlus size={22} className="text-navy/40" />}
        </div>
        <div className="flex flex-col items-start gap-2">
          <button type="button" className="btn-outline btn-sm" onClick={() => input.current?.click()}><Upload size={14} />{value ? 'Заменить' : 'Загрузить'}</button>
          {value && <button type="button" className="btn-danger btn-sm" onClick={() => onChange('')}><Trash2 size={14} />Убрать</button>}
          <input ref={input} type="file" accept="image/*" className="sr-only" onChange={async (e) => { const [r] = await upload(e.target.files); e.target.value = ''; if (r) onChange(r.src); }} />
          {hint && <p className="max-w-[16rem] text-xs text-ink/55">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

/** Несколько картинок с подписями (галерея направления) */
export function GalleryEditor({ items, onChange }: { items: { src: string; caption: string }[]; onChange: (v: { src: string; caption: string }[]) => void }) {
  const upload = useImageUpload();
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const add = async (files: FileList | File[] | null) => { const r = await upload(files); if (r.length) onChange([...items, ...r.map((x) => ({ src: x.src, caption: '' }))]); };
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= items.length) return; const n = [...items]; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); void add(e.dataTransfer.files); }}
        className={`grid place-items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center ${over ? 'border-accent bg-accent/5' : 'border-navy/20 bg-brand-soft/40'}`}
      >
        <Upload className="text-navy/50" />
        <b className="text-sm text-navy">Перетащите изображения сюда</b>
        <p className="max-w-md text-xs text-ink/60">JPG, PNG, WebP или SVG. Фотографии автоматически уменьшаются до 1920 px и сохраняются в WebP.</p>
        <button type="button" className="btn-ink btn-sm" onClick={() => input.current?.click()}><ImagePlus size={14} />Выбрать файлы</button>
        <input ref={input} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { void add(e.target.files); e.target.value = ''; }} />
      </div>
      {items.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((g, i) => (
            <li key={i} className="flex gap-3 rounded-xl border border-navy/10 p-3">
              <img src={assetUrl(g.src)} alt="" className="h-20 w-28 shrink-0 rounded-lg object-cover" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <TextInput value={g.caption} placeholder="Подпись" aria-label={`Подпись к изображению ${i + 1}`} onChange={(e) => onChange(items.map((x, k) => (k === i ? { ...x, caption: e.target.value } : x)))} />
                <div className="flex gap-1">
                  <button type="button" className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Левее"><ChevronUp size={16} className="-rotate-90" /></button>
                  <button type="button" className="icon-btn" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Правее"><ChevronDown size={16} className="-rotate-90" /></button>
                  <button type="button" className="icon-btn icon-btn-danger ml-auto" onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label="Удалить изображение"><Trash2 size={16} /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
