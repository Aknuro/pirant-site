import { useMemo, useState } from 'react';
import { Download, MessageCircle, Phone, Trash2 } from 'lucide-react';
import { download, fmtDate, norm } from '../../store/utils';
import { store, useSite } from '../../store/site';
import { telHref, useContacts } from '../../store/hooks';
import type { InquiryStatus } from '../../types';
import { EmptyState, PageTitle, Panel, Pill, Select, TextInput, useConfirm, useToast } from '../ui';

export const STATUSES: [InquiryStatus, string][] = [['new', 'Новое'], ['in_progress', 'В работе'], ['answered', 'Отвечено']];
export const statusPill = (s: InquiryStatus) => <Pill tone={s === 'new' ? 'new' : s === 'in_progress' ? 'work' : 'done'}>{STATUSES.find((x) => x[0] === s)?.[1]}</Pill>;

export default function Inquiries() {
  const { inquiries } = useSite();
  const c = useContacts();
  const toast = useToast();
  const confirm = useConfirm();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | InquiryStatus>(new URLSearchParams(window.location.search).get('status') as InquiryStatus | '' ?? '');
  const rows = useMemo(() => inquiries.filter((i) => (!status || i.status === status) && (!q || norm([i.name, i.phone, i.company, i.message, i.directionTitle].join(' ')).includes(norm(q)))), [inquiries, q, status]);

  const setSt = async (id: string, s: InquiryStatus) => { try { await store.updateInquiry(id, s); toast('Статус обновлён'); } catch (e) { toast((e as Error).message, 'error'); } };
  const del = async (id: string) => {
    if (!(await confirm({ title: 'Удалить обращение?', text: 'Обращение будет удалено без возможности восстановления.', ok: 'Удалить', danger: true }))) return;
    try { await store.deleteInquiry(id); toast('Обращение удалено'); } catch (e) { toast((e as Error).message, 'error'); }
  };
  const csv = () => {
    const body = [['Дата', 'Имя', 'Телефон', 'Компания', 'Направление', 'Сообщение', 'Канал', 'Статус'], ...rows.map((x) => [fmtDate(x.createdAt, true), x.name, x.phone, x.company, x.directionTitle, x.message, x.channel, STATUSES.find((s) => s[0] === x.status)?.[1] ?? x.status])]
      .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    download(`pirant-obrashcheniya-${new Date().toISOString().slice(0, 10)}.csv`, `\uFEFF${body}`, 'text/csv;charset=utf-8');
  };

  return (
    <>
      <PageTitle title="Обращения" desc="Заявки, которые посетители оставили в окне «Заполните заявку». Хранятся только на сервере компании."
        actions={<button className="btn-outline" onClick={csv}><Download size={16} />Выгрузить в CSV</button>} />
      <Panel>
        <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
          <TextInput type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск: имя, телефон, текст, направление" aria-label="Поиск по обращениям" />
          <Select value={status} onChange={(e) => setStatus(e.target.value as '' | InquiryStatus)} aria-label="Статус"><option value="">Все статусы</option>{STATUSES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
        </div>
        <p className="text-sm text-ink/60" role="status">Показано: {rows.length} из {inquiries.length}</p>
        {rows.length === 0 ? <EmptyState>{inquiries.length ? 'Нет обращений по выбранным условиям.' : 'Обращений пока нет. Когда посетитель оставит заявку на сайте, она появится здесь.'}</EmptyState> : (
          <ul className="divide-y divide-navy/10">
            {rows.map((x) => (
              <li key={x.id} className="grid gap-3 py-4 first:pt-0 last:pb-0 lg:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="text-navy">{x.name}</b>
                    <Pill tone={x.channel === 'telegram' ? 'tg' : x.channel === 'whatsapp' ? 'wa' : 'work'}>{x.channel === 'telegram' ? 'Telegram' : x.channel === 'whatsapp' ? 'WhatsApp' : 'С сайта'}</Pill>
                    
                    <span className="text-xs text-ink/50">{fmtDate(x.createdAt, true)}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink/70">{x.company && `${x.company} · `}{x.directionTitle || 'Направление не выбрано'}</p>
                  <p className="mt-2 whitespace-pre-line text-sm text-ink">{x.message || '—'}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a className="btn-outline btn-sm" href={telHref(x.phone)}><Phone size={14} />{x.phone}</a>
                    {c.whatsapp && <a className="btn-outline btn-sm" target="_blank" rel="noreferrer" href={`https://wa.me/${x.phone.replace(/\D+/g, '')}`}><MessageCircle size={14} />Написать клиенту</a>}
                  </div>
                </div>
                <div className="flex items-start gap-2 lg:flex-col lg:items-end">
                  <Select value={x.status} onChange={(e) => setSt(x.id, e.target.value as InquiryStatus)} aria-label="Статус обращения" className="min-w-[150px]">{STATUSES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
                  <button className="icon-btn icon-btn-danger" onClick={() => del(x.id)} aria-label="Удалить обращение"><Trash2 size={16} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-ink/55">Свяжитесь с клиентом по телефону или в WhatsApp и поставьте статус.</p>
      </Panel>
    </>
  );
}
