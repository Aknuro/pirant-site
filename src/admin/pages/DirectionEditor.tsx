import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { useSite, store } from '../../store/site';
import { clone, fmtDate, nowISO, slugify, uid } from '../../store/utils';
import type { Block, Direction, Item } from '../../types';
import {
  Field, FormGrid, GalleryEditor, GLink, IconSelect, ImageField, LocalizedField, PageTitle, Panel, RowsEditor, SaveBar, Select, Switch,
  TextArea, TextInput, useConfirm, useDraft, useToast,
} from '../ui';

const blank = (): Direction => ({
  id: '', order: 0, published: false, icon: 'layers', title: { ru: '' }, description: { ru: '' }, image: '', hero: '', tagline: '', lead: '',
  specs: [], blocks: [{ id: uid('b'), title: 'Возможности', cols: 3, items: [{ icon: 'check', title: '', text: '' }] }], gallery: [], advantages: [], vendors: [], createdAt: nowISO(), updatedAt: nowISO(),
});
const blankItem = (): Item => ({ icon: 'check', title: '', text: '' });

/** Содержимое блока одной строкой на пункт списка */
const listToText = (l?: string[]) => (l ?? []).join('\n');
const textToList = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

function BlockCard({ block, index, total, onChange, onMove, onRemove }: { block: Block; index: number; total: number; onChange: (b: Block) => void; onMove: (d: number) => void; onRemove: () => void }) {
  const set = (patch: Partial<Block>) => onChange({ ...block, ...patch });
  return (
    <div className="rounded-2xl border border-navy/15 bg-brand-soft/40 p-4">
      <div className="flex items-start gap-3">
        <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-navy text-sm font-bold text-white">{index + 1}</span>
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
          <Field label={`Заголовок раздела ${index + 1}`}><TextInput value={block.title} onChange={(e) => set({ title: e.target.value })} placeholder="Например: Ключевое оборудование" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Колонок в ряду"><Select value={block.cols ?? 3} onChange={(e) => set({ cols: Number(e.target.value) as 2 | 3 | 4 })}><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option></Select></Field>
            <Field label="Пропорции фото"><Select value={block.ratio ?? 'aspect-[16/10]'} onChange={(e) => set({ ratio: e.target.value })}><option value="aspect-[16/10]">16:10</option><option value="aspect-[4/3]">4:3</option><option value="aspect-[16/7]">Широкое</option></Select></Field>
          </div>
          <Field label="Вступление (необязательно)" span><TextInput value={block.intro ?? ''} onChange={(e) => set({ intro: e.target.value })} /></Field>
        </div>
        <div className="flex shrink-0 gap-1">
          <button type="button" className="icon-btn" disabled={index === 0} onClick={() => onMove(-1)} aria-label={`Раздел ${index + 1} выше`}><ChevronUp size={16} /></button>
          <button type="button" className="icon-btn" disabled={index === total - 1} onClick={() => onMove(1)} aria-label={`Раздел ${index + 1} ниже`}><ChevronDown size={16} /></button>
          <button type="button" className="icon-btn icon-btn-danger" onClick={onRemove} aria-label={`Удалить раздел «${block.title}»`}><Trash2 size={16} /></button>
        </div>
      </div>
      <div className="mt-4">
        <RowsEditor<Item> rows={block.items} onChange={(items) => set({ items })} blank={blankItem} addText="Добавить элемент" empty="В разделе пока нет элементов."
          render={(it, i, setItem) => (
            <div className="grid gap-3 lg:grid-cols-[230px_1fr]">
              <div className="space-y-3">
                <Field label="Иконка"><IconSelect value={it.icon ?? 'check'} onChange={(v) => setItem({ icon: v })} label={`Иконка элемента ${i + 1}`} /></Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Заголовок"><TextInput value={it.title} onChange={(e) => setItem({ title: e.target.value })} placeholder="Например: Радиосвязь" /></Field>
                <Field label="Описание (необязательно)"><TextInput value={it.text ?? ''} onChange={(e) => setItem({ text: e.target.value })} placeholder="TETRA, DMR, APCO-25" /></Field>
                <Field label="Список пунктов (по одному в строке)" hint="Если заполнено — выводится галочками под описанием." span>
                  <TextArea rows={2} value={listToText(it.list)} onChange={(e) => setItem({ list: textToList(e.target.value) })} />
                </Field>
                <div className="sm:col-span-2">
                  <ImageField label="Фото элемента (необязательно)" value={it.image ?? ''} onChange={(v) => setItem({ image: v || undefined })} aspect="aspect-[16/10]" />
                </div>
              </div>
            </div>
          )} />
      </div>
    </div>
  );
}

export default function DirectionEditor() {
  const { id = 'new' } = useParams();
  const { directions, partners } = useSite();
  const existing = directions.find((d) => d.id === id);
  const isNew = id === 'new';
  if (!isNew && !existing) {
    return <><PageTitle title="Направление не найдено" desc="Возможно, его удалили." /><GLink to="/admin/directions" className="btn-outline">Вернуться к списку</GLink></>;
  }
  return <Editor key={id} initial={existing ?? blank()} isNew={isNew} partnersList={partners} />;
}

function Editor({ initial, isNew, partnersList }: { initial: Direction; isNew: boolean; partnersList: { id: string; name: string }[] }) {
  const { draft, update, reset, dirty } = useDraft<Direction>(clone(initial));
  const [slug, setSlug] = useState(initial.id);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [customScheme, setCustomScheme] = useState(!!initial.scheme?.steps.length);
  const nav = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const set = (patch: Partial<Direction>) => update((d) => ({ ...d, ...patch }));
  const slugPreview = useMemo(() => (isNew ? slugify(slug || draft.title.ru) : initial.id), [isNew, slug, draft.title.ru, initial.id]);
  const [vendorQ, setVendorQ] = useState('');
  useEffect(() => { document.title = `${isNew ? 'Новое направление' : draft.title.ru || 'Направление'} — панель PIRANT`; }, [isNew, draft.title.ru]);

  const moveBlock = (i: number, d: number) => update((x) => { const b = [...x.blocks]; const j = i + d; [b[i], b[j]] = [b[j], b[i]]; return { ...x, blocks: b }; });

  const save = async (e?: FormEvent) => {
    e?.preventDefault();
    setErr('');
    if (!draft.title.ru.trim()) { setErr('Укажите название направления — оно показывается в меню, на главной и в заявке.'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const out = clone(draft);
    out.id = isNew ? slugify(slug || draft.title.ru) : initial.id;
    out.title.ru = out.title.ru.trim();
    out.blocks = out.blocks.map((b) => ({ ...b, id: b.id || uid('b'), items: b.items.filter((i) => i.title.trim() || (i.text ?? '').trim() || i.image).map((i) => ({ ...i, list: i.list?.length ? i.list : undefined })) })).filter((b) => b.title.trim() || b.items.length);
    out.specs = out.specs.filter((s) => s.label.trim() || s.value.trim());
    out.advantages = out.advantages.map((a) => a.trim()).filter(Boolean);
    out.scheme = customScheme && out.scheme ? { ...out.scheme, steps: out.scheme.steps.filter((s) => s.title.trim()) } : undefined;
    if (!out.image) out.image = out.hero || out.gallery[0]?.src || '';
    setSaving(true);
    try {
      const saved = await store.saveDirection(out);
      toast(isNew ? 'Направление добавлено' : 'Изменения сохранены');
      reset(clone(saved));
      if (isNew) nav(`/admin/directions/${saved.id}`, { replace: true });
    } catch (ex) { setErr((ex as Error).message); window.scrollTo({ top: 0, behavior: 'smooth' }); } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!(await confirm({ title: 'Удалить направление?', text: `«${initial.title.ru}» и его страница будут удалены без возможности восстановления.`, ok: 'Удалить', danger: true }))) return;
    try { await store.deleteDirection(initial.id); reset(clone(draft)); toast('Направление удалено'); nav('/admin/directions'); } catch (ex) { toast((ex as Error).message, 'error'); }
  };

  const vendors = partnersList.filter((p) => !vendorQ || p.name.toLowerCase().includes(vendorQ.toLowerCase()));

  return (
    <form onSubmit={save} noValidate>
      <nav aria-label="Навигационная цепочка" className="mb-3 text-sm text-ink/60"><GLink to="/admin/directions" className="font-semibold text-brand hover:underline">Направления</GLink> / {isNew ? 'Новое направление' : initial.title.ru}</nav>
      <PageTitle title={isNew ? 'Новое направление' : 'Редактирование направления'}
        desc={isNew ? 'Заполните поля и нажмите «Сохранить». Новое направление сохраняется черновиком.' : `Создано ${fmtDate(initial.createdAt)}, изменено ${fmtDate(initial.updatedAt, true)}`}
        actions={!isNew && <a className="btn-outline" href={`/services/${initial.id}`} target="_blank" rel="noreferrer"><ExternalLink size={16} />Открыть на сайте</a>} />
      {err && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{err}</div>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Panel title="Основное">
            <FormGrid>
              <div className="sm:col-span-2"><LocalizedField label="Название направления *" value={draft.title} onChange={(title) => set({ title })} /></div>
              <div className="sm:col-span-2"><LocalizedField label="Кратко (для карточки и меню)" value={draft.description} onChange={(description) => set({ description })} multiline rows={2} /></div>
              <Field label="Иконка"><IconSelect value={draft.icon} onChange={(icon) => set({ icon })} /></Field>
              <Field label="Слоган (оранжевая строка)"><TextInput value={draft.tagline} onChange={(e) => set({ tagline: e.target.value })} placeholder="Оперативность. Надёжность. Автономность." /></Field>
              <Field label="Описание под заголовком страницы" span><TextArea rows={3} value={draft.lead} onChange={(e) => set({ lead: e.target.value })} /></Field>
              <ImageField label="Картинка карточки на главной" value={draft.image} onChange={(image) => set({ image })} hint="Если не задана — возьмётся фон страницы." />
              <ImageField label="Фон верхнего экрана страницы" value={draft.hero} onChange={(hero) => set({ hero })} hint="Затемняется, поверх него — заголовок." />
            </FormGrid>
          </Panel>

          <Panel title="Ключевые характеристики" desc="Пары «Параметр — значение», например: Шасси — 6×6. Если пусто, блок на странице не показывается.">
            <RowsEditor rows={draft.specs} onChange={(specs) => set({ specs })} blank={() => ({ label: '', value: '' })} addText="Добавить характеристику"
              render={(s, i, setS) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextInput value={s.label} onChange={(e) => setS({ label: e.target.value })} placeholder="Параметр: Запас хода" aria-label={`Параметр ${i + 1}`} />
                  <TextInput value={s.value} onChange={(e) => setS({ value: e.target.value })} placeholder="Значение: ≥ 500 км" aria-label={`Значение ${i + 1}`} />
                </div>
              )} />
          </Panel>

          <Panel title="Разделы страницы" desc="Блоки после описания: возможности, технологии, оборудование. Элементы с иконкой и текстом выводятся карточками, только с названием — плитками.">
            <div className="space-y-4">
              {draft.blocks.map((b, i) => (
                <BlockCard key={b.id} block={b} index={i} total={draft.blocks.length} onMove={(d) => moveBlock(i, d)}
                  onChange={(nb) => update((x) => ({ ...x, blocks: x.blocks.map((y, k) => (k === i ? nb : y)) }))}
                  onRemove={() => update((x) => ({ ...x, blocks: x.blocks.filter((_, k) => k !== i) }))} />
              ))}
              <button type="button" className="btn-ink btn-sm" onClick={() => update((x) => ({ ...x, blocks: [...x.blocks, { id: uid('b'), title: '', cols: 3, items: [blankItem()] }] }))}><Plus size={14} />Добавить раздел</button>
            </div>
          </Panel>

          <Panel title="Схема «Как это работает»" desc="Пошаговая схема на странице. По умолчанию показывается общий «полный цикл» компании.">
            <Switch checked={customScheme} onChange={(v) => { setCustomScheme(v); if (v && !draft.scheme) set({ scheme: { title: 'Как работает система', steps: [{ title: '', text: '' }] } }); }} label="Своя схема для этого направления" hint="Выключено — используется общий цикл из раздела «О компании»." />
            {customScheme && draft.scheme && (
              <>
                <Field label="Заголовок схемы"><TextInput value={draft.scheme.title} onChange={(e) => set({ scheme: { ...draft.scheme!, title: e.target.value } })} /></Field>
                <RowsEditor rows={draft.scheme.steps} onChange={(steps) => set({ scheme: { ...draft.scheme!, steps } })} blank={() => ({ title: '', text: '' })} addText="Добавить шаг"
                  render={(s, i, setS) => (
                    <div className="grid gap-3 sm:grid-cols-[1fr_1.6fr]">
                      <TextInput value={s.title} onChange={(e) => setS({ title: e.target.value })} placeholder={`Шаг ${i + 1}: название`} aria-label={`Название шага ${i + 1}`} />
                      <TextArea rows={2} value={s.text} onChange={(e) => setS({ text: e.target.value })} placeholder="Описание" aria-label={`Описание шага ${i + 1}`} />
                    </div>
                  )} />
              </>
            )}
          </Panel>

          <Panel title="Фотогалерея" desc="Фотографии и схемы направления. Порядок здесь — порядок на странице.">
            <GalleryEditor items={draft.gallery} onChange={(gallery) => set({ gallery })} />
          </Panel>

          <Panel title="Преимущества" desc="Список галочек в конце страницы.">
            <RowsEditor<string> rows={draft.advantages} onChange={(advantages) => set({ advantages })} blank={() => ''} addText="Добавить преимущество"
              render={(a, i, _s) => <TextInput value={a} onChange={(e) => set({ advantages: draft.advantages.map((x, k) => (k === i ? e.target.value : x)) })} aria-label={`Преимущество ${i + 1}`} placeholder="Например: Круглосуточная эксплуатация 24/7" />} />
          </Panel>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <Panel title="Публикация">
            <Switch checked={draft.published} onChange={(published) => set({ published })} label="Опубликовано" hint="Видно посетителям сайта" />
            <Field label="Адрес страницы" hint={<>pirant.kz/services/<b>{slugPreview || '…'}</b>{!isNew && ' (после создания не меняется)'}</>}>
              <TextInput value={isNew ? slug : initial.id} disabled={!isNew} onChange={(e) => setSlug(e.target.value)} placeholder="заполнится из названия" />
            </Field>
          </Panel>
          <Panel title="Производители" desc="Логотипы в конце страницы направления.">
            <TextInput type="search" value={vendorQ} onChange={(e) => setVendorQ(e.target.value)} placeholder="Найти производителя" aria-label="Поиск производителя" />
            <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
              {vendors.map((p) => (
                <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-brand-soft">
                  <input type="checkbox" className="h-4 w-4 accent-[#F28C1B]" checked={draft.vendors.includes(p.id)}
                    onChange={(e) => set({ vendors: e.target.checked ? [...draft.vendors, p.id] : draft.vendors.filter((v) => v !== p.id) })} />
                  {p.name}
                </label>
              ))}
              {vendors.length === 0 && <p className="text-sm text-ink/55">Никого не найдено.</p>}
            </div>
            <p className="text-xs text-ink/55">Выбрано: {draft.vendors.length}</p>
          </Panel>
        </aside>
      </div>

      <SaveBar dirty={dirty} saving={saving} stateText={isNew && !dirty ? 'Новое направление ещё не сохранено' : undefined}>
        {!isNew && <button type="button" className="btn-danger" onClick={remove}><Trash2 size={16} />Удалить</button>}
        <GLink to="/admin/directions" className="btn-outline">Отмена</GLink>
      </SaveBar>
    </form>
  );
}
