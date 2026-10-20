import { useCallback, useEffect, useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { api } from '../../store/api';
import { fmtDate } from '../../store/utils';
import { EmptyState, PageTitle, Panel, Pill, useConfirm, useToast } from '../ui';

interface Recipient { chat_id: string; label: string; kind: string; status: 'pending' | 'approved'; created_at: string }

export default function Notifications() {
  const toast = useToast();
  const confirm = useConfirm();
  const [state, setState] = useState<{ botEnabled: boolean; recipients: Recipient[] } | null>(null);
  const load = useCallback(() => api('GET', '/admin/telegram').then(setState).catch((e) => toast((e as Error).message, 'error')), [toast]);
  useEffect(() => { void load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  const approve = async (id: string) => { try { await api('POST', `/admin/telegram/${id}/approve`); toast('Получатель подтверждён'); await load(); } catch (e) { toast((e as Error).message, 'error'); } };
  const remove = async (r: Recipient) => {
    if (!(await confirm({ title: 'Убрать получателя?', text: `«${r.label}» перестанет получать уведомления о заявках.`, ok: 'Убрать', danger: true }))) return;
    try { await api('DELETE', `/admin/telegram/${r.chat_id}`); await load(); } catch (e) { toast((e as Error).message, 'error'); }
  };

  return (
    <>
      <PageTitle title="Уведомления" desc="Кто получает сообщение «Новая заявка» в Telegram. В сообщении нет данных заявки — только ссылка на панель." />
      <div className="space-y-6">
        {state && !state.botEnabled && <Panel title="Бот не подключён"><p className="text-sm text-ink/75">На сервере не задан токен бота (переменная TELEGRAM_BOT_TOKEN). Его вносит администратор сервера, в панель и в чат токен вводить не нужно.</p></Panel>}
        <Panel title="Получатели">
          <p className="text-sm text-ink/70">Сотрудник пишет боту <b>/start</b> (или бота добавляют в рабочую группу) — запрос появляется здесь. Уведомления приходят только подтверждённым получателям.</p>
          {!state ? <p className="text-sm text-ink/60">Загрузка…</p> : state.recipients.length === 0 ? <EmptyState>Запросов пока нет.</EmptyState> : (
            <ul className="divide-y divide-navy/10">
              {state.recipients.map((r) => (
                <li key={r.chat_id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <b className="text-navy">{r.label}</b> <Pill>{r.kind === 'private' ? 'личный чат' : 'группа'}</Pill> <Pill tone={r.status === 'approved' ? 'ok' : 'new'}>{r.status === 'approved' ? 'Подтверждён' : 'Ждёт подтверждения'}</Pill>
                    <p className="text-xs text-ink/50">Запрос от {fmtDate(r.created_at, true)}</p>
                  </div>
                  <div className="flex gap-1">
                    {r.status === 'pending' && <button className="btn-accent btn-sm" onClick={() => approve(r.chat_id)}><Check size={14} />Подтвердить</button>}
                    <button className="icon-btn icon-btn-danger" onClick={() => remove(r)} aria-label={`Убрать ${r.label}`}><Trash2 size={16} /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
