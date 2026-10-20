import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { fmtDate, norm } from '../../store/utils';
import { store, useSite } from '../../store/site';
import { EmptyState, GLink, PageTitle, Panel, Pill, TextInput, useConfirm, useToast } from '../ui';

export default function NewsList() {
  const { news } = useSite();
  const toast = useToast();
  const confirm = useConfirm();
  const [q, setQ] = useState('');
  const rows = useMemo(() => [...news].sort((a, b) => b.date.localeCompare(a.date)).filter((n) => !q || norm(`${n.title.ru} ${n.title.en ?? ''} ${n.date}`).includes(norm(q))), [news, q]);
  const del = async (id: number, title: string) => {
    if (!(await confirm({ title: 'Удалить новость?', text: `«${title}» исчезнет с сайта и из истории компании.`, ok: 'Удалить', danger: true }))) return;
    try { await store.deleteNews(id); toast('Новость удалена'); } catch (e) { toast((e as Error).message, 'error'); }
  };
  return (
    <>
      <PageTitle title="Новости и история" desc="События компании. Отмеченные «В истории» попадают ещё и на страницу «Наша история»."
        actions={<GLink to="/admin/news/new" className="btn-accent"><Plus size={16} />Добавить новость</GLink>} />
      <Panel>
        <TextInput type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по заголовку или дате" aria-label="Поиск новостей" />
        {rows.length === 0 ? <EmptyState>Ничего не найдено.</EmptyState> : (
          <ul className="divide-y divide-navy/10">
            {rows.map((n) => (
              <li key={n.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                {n.image ? <img src={n.image} alt="" className="h-14 w-20 shrink-0 rounded-md object-cover" /> : <span className="h-14 w-20 shrink-0 rounded-md bg-brand-soft" />}
                <div className="min-w-0 flex-1">
                  <GLink to={`/admin/news/${n.id}`} className="block truncate font-semibold text-navy hover:text-brand">{n.title.ru}</GLink>
                  <span className="text-xs text-ink/55">{fmtDate(n.date)}</span>
                </div>
                {n.showInHistory && <Pill tone="work">В истории</Pill>}
                <div className="flex gap-1">
                  <GLink to={`/admin/news/${n.id}`} className="icon-btn" aria-label={`Редактировать: ${n.title.ru}`}><Pencil size={16} /></GLink>
                  <button className="icon-btn icon-btn-danger" onClick={() => del(n.id, n.title.ru)} aria-label={`Удалить: ${n.title.ru}`}><Trash2 size={16} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
