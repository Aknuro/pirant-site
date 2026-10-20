import { Link } from 'react-router-dom';
import { Database, ExternalLink } from 'lucide-react';
import { fmtDate } from '../../store/utils';
import { useSession, useSite } from '../../store/site';
import { GLink, PageTitle, Panel, Pill } from '../ui';
import { statusPill } from './Inquiries';

export default function Dashboard() {
  const me = useSession()!;
  const { directions, inquiries, news, partners } = useSite();
  const pub = directions.filter((d) => d.published).length;
  const fresh = inquiries.filter((i) => i.status === 'new').length;
  const tiles = [
    { to: '/admin/directions', v: pub, l: 'опубликованных направлений' },
    { to: '/admin/directions', v: directions.length - pub, l: 'черновиков' },
    { to: '/admin/inquiries', v: fresh, l: 'новых обращений', accent: true },
    { to: '/admin/news', v: news.length, l: 'новостей и событий' },
    ...(me.role === 'superadmin' ? [{ to: '/admin/partners', v: partners.length, l: 'партнёров в каталоге' }] : []),
  ];
  return (
    <>
      <PageTitle title="Обзор" desc={`Здравствуйте, ${me.name}. Сводка по сайту и обращениям.`}
        actions={<a className="btn-outline" href="/" target="_blank" rel="noreferrer"><ExternalLink size={16} />Открыть сайт</a>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {tiles.map((t) => (
          <GLink key={t.l} to={t.to} className={`rounded-2xl border p-5 transition-shadow hover:shadow-md ${t.accent ? 'border-accent/40 bg-accent/10' : 'border-navy/10 bg-white'}`}>
            <span className={`block text-4xl font-extrabold ${t.accent ? 'text-accent-dark' : 'text-navy'}`}>{t.v}</span>
            <span className="mt-1 block text-sm text-ink/70">{t.l}</span>
          </GLink>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Последние обращения" actions={<Link to="/admin/inquiries" className="text-sm font-semibold text-brand hover:underline">Все обращения</Link>}>
          {inquiries.length === 0 ? <p className="text-sm text-ink/60">Обращений пока нет. Они появятся, когда посетитель оставит заявку на сайте.</p> : (
            <ul className="divide-y divide-navy/10">
              {inquiries.slice(0, 5).map((q) => (
                <li key={q.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy">{q.name} · {q.phone}</p>
                    <p className="line-clamp-2 text-sm text-ink/70">{q.message || '—'}</p>
                    <p className="mt-0.5 text-xs text-ink/50">{fmtDate(q.createdAt, true)}{q.directionTitle && ` · ${q.directionTitle}`}</p>
                  </div>
                  {statusPill(q.status)}
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Направления" actions={<Link to="/admin/directions" className="text-sm font-semibold text-brand hover:underline">Управлять</Link>}>
          <ul className="divide-y divide-navy/10">
            {[...directions].sort((a, b) => a.order - b.order).map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <Link to={`/admin/directions/${d.id}`} className="block truncate text-sm font-semibold text-navy hover:text-brand">{d.title.ru}</Link>
                  <span className="text-xs text-ink/50">изменено {fmtDate(d.updatedAt)}</span>
                </div>
                <Pill tone={d.published ? 'ok' : 'draft'}>{d.published ? 'Опубликовано' : 'Черновик'}</Pill>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <p className="mt-6 flex items-start gap-3 rounded-xl border border-navy/10 bg-white p-4 text-sm text-ink/70">
        <Database size={18} className="mt-0.5 shrink-0 text-brand" />
        <span>Данные хранятся в базе PostgreSQL на сервере. Дополнительную копию можно скачать в разделе «Данные и копии».</span>
      </p>
    </>
  );
}
