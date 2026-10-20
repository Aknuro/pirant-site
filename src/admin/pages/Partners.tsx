import { useMemo, useState, type FormEvent } from 'react';
import { ChevronDown, ChevronUp, ImagePlus, Plus, Trash2, Upload } from 'lucide-react';
import { assetUrl } from '../../assetUrl';
import { ui } from '../../i18n/ui';
import { store, useSite } from '../../store/site';
import { clone, norm, uid } from '../../store/utils';
import type { Partner, PartnerCategory } from '../../types';
import { Field, LocalizedField, PageTitle, Panel, SaveBar, Select, Switch, TextInput, useConfirm, useDraft, useImageUpload, useToast } from '../ui';

const CATS: PartnerCategory[] = ['radio', 'security', 'servers', 'video', 'cuav'];
const catName = (c: PartnerCategory) => ui[`cat_${c}` as keyof typeof ui].ru;

export default function Partners() {
  const site = useSite();
  const { draft, update, reset, dirty } = useDraft<Partner[]>(clone(site.partners));
  const [q, setQ] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const toast = useToast();
  const confirm = useConfirm();
  const upload = useImageUpload();
  const [openId, setOpenId] = useState<string | null>(null);

  const setP = (id: string, patch: Partial<Partner>) => update((l) => l.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const move = (id: string, d: number) => update((l) => { const i = l.findIndex((p) => p.id === id), j = i + d; if (j < 0 || j >= l.length) return l; const n = [...l]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const shown = useMemo(() => draft.filter((p) => !q || norm(p.name).includes(norm(q))), [draft, q]);
  const featured = draft.filter((p) => p.featured).length;

  const add = () => { const p: Partner = { id: uid('partner'), name: '', category: 'servers', logo: '', description: { ru: '' }, featured: false }; update((l) => [p, ...l]); setOpenId(p.id); setQ(''); };
  const remove = async (p: Partner) => {
    if (!(await confirm({ title: 'Удалить партнёра?', text: `«${p.name || 'Без названия'}» исчезнет из каталога и со страниц направлений.`, ok: 'Удалить', danger: true }))) return;
    update((l) => l.filter((x) => x.id !== p.id));
  };
  const save = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setSaving(true);
    try { await store.savePartners(draft); reset(clone(draft)); toast('Сохранено'); } catch (ex) { setErr((ex as Error).message); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={save} noValidate>
      <PageTitle title="Партнёры" desc={`Каталог производителей на странице «Партнёры». Отмеченные «На главной» показываются полосой логотипов на главной странице (сейчас: ${featured}).`}
        actions={<button type="button" className="btn-accent" onClick={add}><Plus size={16} />Добавить партнёра</button>} />
      {err && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{err}</div>}
      <Panel>
        <TextInput type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Найти партнёра" aria-label="Поиск партнёра" />
        <p className="text-xs text-ink/55">Подходят логотипы на прозрачном или белом фоне. Порядок кнопками работает в полном списке (без поиска).</p>
        <ul className="space-y-3">
          {shown.map((p) => {
            const i = draft.findIndex((x) => x.id === p.id);
            const open = openId === p.id;
            return (
              <li key={p.id} className="rounded-xl border border-navy/10 bg-white p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid h-14 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-navy/10 bg-white p-1.5">
                    {p.logo ? <img src={assetUrl(p.logo)} alt="" className="max-h-full max-w-full object-contain" /> : <ImagePlus size={18} className="text-navy/35" />}
                  </span>
                  <div className="min-w-[160px] flex-1"><TextInput value={p.name} onChange={(e) => setP(p.id, { name: e.target.value })} placeholder="Название" aria-label="Название партнёра" /></div>
                  <div className="w-44"><Select value={p.category} onChange={(e) => setP(p.id, { category: e.target.value as PartnerCategory })} aria-label="Категория">{CATS.map((c) => <option key={c} value={c}>{catName(c)}</option>)}</Select></div>
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-navy"><input type="checkbox" className="h-4 w-4 accent-[#F28C1B]" checked={p.featured} onChange={(e) => setP(p.id, { featured: e.target.checked })} />На главной</label>
                  <div className="flex gap-1">
                    <button type="button" className="btn-outline btn-sm" onClick={() => setOpenId(open ? null : p.id)} aria-expanded={open}>{open ? 'Свернуть' : 'Изменить'}</button>
                    <button type="button" className="icon-btn" disabled={!!q || i === 0} onClick={() => move(p.id, -1)} aria-label={`${p.name} выше`}><ChevronUp size={16} /></button>
                    <button type="button" className="icon-btn" disabled={!!q || i === draft.length - 1} onClick={() => move(p.id, 1)} aria-label={`${p.name} ниже`}><ChevronDown size={16} /></button>
                    <button type="button" className="icon-btn icon-btn-danger" onClick={() => remove(p)} aria-label={`Удалить ${p.name}`}><Trash2 size={16} /></button>
                  </div>
                </div>
                {open && (
                  <div className="mt-4 grid gap-4 border-t border-navy/10 pt-4 sm:grid-cols-[220px_1fr]">
                    <Field label="Логотип">
                      <label className="btn-outline btn-sm cursor-pointer"><Upload size={14} />{p.logo ? 'Заменить' : 'Загрузить'}
                        <input type="file" accept="image/*" className="sr-only" onChange={async (e) => { const [r] = await upload(e.target.files); e.target.value = ''; if (r) setP(p.id, { logo: r.src }); }} />
                      </label>
                      {p.logo && <button type="button" className="btn-danger btn-sm ml-2" onClick={() => setP(p.id, { logo: '' })}>Убрать</button>}
                    </Field>
                    <LocalizedField label="Описание" value={p.description} onChange={(description) => setP(p.id, { description })} multiline rows={2} />
                    <div className="sm:col-span-2"><Switch checked={p.featured} onChange={(featured) => setP(p.id, { featured })} label="Показывать на главной" /></div>
                  </div>
                )}
              </li>
            );
          })}
          {shown.length === 0 && <li className="text-sm text-ink/60">Ничего не найдено.</li>}
        </ul>
      </Panel>
      <SaveBar dirty={dirty} saving={saving} />
    </form>
  );
}
