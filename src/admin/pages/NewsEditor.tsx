import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ExternalLink, Trash2 } from 'lucide-react';
import { store, useSite } from '../../store/site';
import { clone } from '../../store/utils';
import type { NewsItem } from '../../types';
import { Field, FormGrid, GLink, ImageField, LocalizedField, PageTitle, Panel, SaveBar, Switch, TextInput, useConfirm, useDraft, useToast } from '../ui';

const today = () => new Date().toISOString().slice(0, 10);

export default function NewsEditor() {
  const { id = 'new' } = useParams();
  const { news } = useSite();
  const existing = news.find((n) => String(n.id) === id);
  if (id !== 'new' && !existing) return <><PageTitle title="Новость не найдена" /><GLink to="/admin/news" className="btn-outline">Вернуться к списку</GLink></>;
  return <Editor key={id} initial={existing ?? { id: 0, title: { ru: '' }, text: { ru: '' }, date: today(), image: '', showInHistory: false, year: new Date().getFullYear() }} isNew={id === 'new'} />;
}

function Editor({ initial, isNew }: { initial: NewsItem; isNew: boolean }) {
  const { draft, update, reset, dirty } = useDraft<NewsItem>(clone(initial));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const nav = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const set = (patch: Partial<NewsItem>) => update((d) => ({ ...d, ...patch }));

  const save = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setSaving(true);
    try {
      const saved = await store.saveNews(draft);
      toast(isNew ? 'Новость добавлена' : 'Изменения сохранены');
      reset(clone(saved));
      if (isNew) nav(`/admin/news/${saved.id}`, { replace: true });
    } catch (ex) { setErr((ex as Error).message); window.scrollTo({ top: 0, behavior: 'smooth' }); } finally { setSaving(false); }
  };
  const remove = async () => {
    if (!(await confirm({ title: 'Удалить новость?', text: `«${initial.title.ru}» исчезнет с сайта.`, ok: 'Удалить', danger: true }))) return;
    try { await store.deleteNews(initial.id); reset(clone(draft)); toast('Новость удалена'); nav('/admin/news'); } catch (ex) { toast((ex as Error).message, 'error'); }
  };

  return (
    <form onSubmit={save} noValidate>
      <nav className="mb-3 text-sm text-ink/60"><GLink to="/admin/news" className="font-semibold text-brand hover:underline">Новости и история</GLink> / {isNew ? 'Новая новость' : initial.title.ru}</nav>
      <PageTitle title={isNew ? 'Новая новость' : 'Редактирование новости'}
        actions={!isNew && <a className="btn-outline" href={`/news/${initial.id}`} target="_blank" rel="noreferrer"><ExternalLink size={16} />Открыть на сайте</a>} />
      {err && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{err}</div>}
      <div className="max-w-3xl space-y-6">
        <Panel title="Содержание">
          <LocalizedField label="Заголовок *" value={draft.title} onChange={(title) => set({ title })} />
          <LocalizedField label="Текст" value={draft.text} onChange={(text) => set({ text })} multiline rows={6} />
          <FormGrid>
            <Field label="Дата *"><TextInput type="date" value={draft.date} onChange={(e) => set({ date: e.target.value })} /></Field>
            <div />
            <ImageField label="Изображение" value={draft.image} onChange={(image) => set({ image })} />
          </FormGrid>
        </Panel>
        <Panel title="Где показывать">
          <Switch checked={draft.showInHistory} onChange={(showInHistory) => set({ showInHistory })} label="Показывать в «Нашей истории»" hint="Запись появится на временной шкале страницы «Наша история»." />
        </Panel>
      </div>
      <SaveBar dirty={dirty} saving={saving} stateText={isNew && !dirty ? 'Новость ещё не сохранена' : undefined}>
        {!isNew && <button type="button" className="btn-danger" onClick={remove}><Trash2 size={16} />Удалить</button>}
        <GLink to="/admin/news" className="btn-outline">Отмена</GLink>
      </SaveBar>
    </form>
  );
}
