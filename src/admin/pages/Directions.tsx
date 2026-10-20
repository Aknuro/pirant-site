import { ChevronDown, ChevronUp, Copy, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { assetUrl } from '../../assetUrl';
import ServiceIcon from '../../components/ServiceIcon';
import { clone, fmtDate, nowISO, plural } from '../../store/utils';
import { store, useSite } from '../../store/site';
import { GLink, PageTitle, Panel, Pill, useConfirm, useToast } from '../ui';

export default function Directions() {
  const { directions } = useSite();
  const toast = useToast();
  const confirm = useConfirm();
  const list = [...directions].sort((a, b) => a.order - b.order);

  const move = async (id: string, delta: number) => {
    const ids = list.map((d) => d.id);
    const i = ids.indexOf(id), j = i + delta;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    try { await store.reorderDirections(ids); } catch (e) { toast((e as Error).message, 'error'); }
  };
  const remove = async (id: string, name: string) => {
    if (!(await confirm({ title: 'Удалить направление?', text: `«${name}» и его страница будут удалены без возможности восстановления.`, ok: 'Удалить', danger: true }))) return;
    try { await store.deleteDirection(id); toast('Направление удалено'); } catch (e) { toast((e as Error).message, 'error'); }
  };
  const duplicate = async (id: string) => {
    const src = directions.find((d) => d.id === id)!;
    const copy = clone(src);
    copy.id = ''; copy.published = false; copy.title.ru = `${src.title.ru} (копия)`; copy.createdAt = nowISO();
    try { const saved = await store.saveDirection(copy); toast('Копия создана как черновик'); window.location.assign(`/admin/directions/${saved.id}`); } catch (e) { toast((e as Error).message, 'error'); }
  };

  return (
    <>
      <PageTitle title="Направления" desc="Каждое направление — карточка на главной и отдельная страница. Порядок здесь совпадает с порядком на сайте."
        actions={<GLink to="/admin/directions/new" className="btn-accent"><Plus size={16} />Добавить направление</GLink>} />
      <Panel>
        <div className="relative -mx-2 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-ink/50">
              <tr><th className="px-2 py-2">Порядок</th><th className="px-2 py-2">Направление</th><th className="px-2 py-2">Статус</th><th className="px-2 py-2">Изменено</th><th className="px-2 py-2"><span className="sr-only">Действия</span></th></tr>
            </thead>
            <tbody className="divide-y divide-navy/10">
              {list.map((d, i) => (
                <tr key={d.id}>
                  <td className="px-2 py-3">
                    <div className="flex gap-1">
                      <button className="icon-btn" disabled={i === 0} onClick={() => move(d.id, -1)} aria-label={`Поднять «${d.title.ru}»`}><ChevronUp size={16} /></button>
                      <button className="icon-btn" disabled={i === list.length - 1} onClick={() => move(d.id, 1)} aria-label={`Опустить «${d.title.ru}»`}><ChevronDown size={16} /></button>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-3">
                      {d.image ? <img src={assetUrl(d.image)} alt="" className="h-12 w-16 shrink-0 rounded-md object-cover" /> : <span className="grid h-12 w-16 shrink-0 place-items-center rounded-md bg-brand-soft text-brand"><ServiceIcon name={d.icon} size={22} /></span>}
                      <div className="min-w-0">
                        <Link to={`/admin/directions/${d.id}`} className="block font-semibold text-navy hover:text-brand"><span className="text-accent-dark">{i + 1}.</span> {d.title.ru}</Link>
                        <span className="text-xs text-ink/55">{d.blocks.length} {plural(d.blocks.length, ['раздел', 'раздела', 'разделов'])} · {d.gallery.length} изобр. · /services/{d.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3"><Pill tone={d.published ? 'ok' : 'draft'}>{d.published ? 'Опубликовано' : 'Черновик'}</Pill></td>
                  <td className="whitespace-nowrap px-2 py-3 text-ink/70">{fmtDate(d.updatedAt)}</td>
                  <td className="px-2 py-3">
                    <div className="flex justify-end gap-1">
                      <GLink to={`/admin/directions/${d.id}`} className="icon-btn" aria-label={`Редактировать: ${d.title.ru}`} title="Редактировать"><Pencil size={16} /></GLink>
                      <a href={`/services/${d.id}`} target="_blank" rel="noreferrer" className="icon-btn" aria-label={`Открыть на сайте: ${d.title.ru}`} title="Открыть на сайте"><ExternalLink size={16} /></a>
                      <button className="icon-btn" onClick={() => duplicate(d.id)} aria-label={`Создать копию: ${d.title.ru}`} title="Создать копию"><Copy size={16} /></button>
                      <button className="icon-btn icon-btn-danger" onClick={() => remove(d.id, d.title.ru)} aria-label={`Удалить: ${d.title.ru}`} title="Удалить"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={5} className="px-2 py-8 text-center text-ink/60">Направлений пока нет. <Link className="font-semibold text-brand" to="/admin/directions/new">Добавьте первое</Link>.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
