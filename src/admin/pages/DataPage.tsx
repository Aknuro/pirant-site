import { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { store } from '../../store/site';
import { download } from '../../store/utils';
import { PageTitle, Panel, useConfirm, useToast } from '../ui';

export default function DataPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const file = useRef<HTMLInputElement>(null);

  const exportAll = async () => {
    try { download(`pirant-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(await store.exportData(), null, 2), 'application/json'); toast('Файл выгрузки сформирован'); }
    catch (e) { toast((e as Error).message, 'error'); }
  };
  const importFile = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      if (!(await confirm({ title: 'Загрузить данные из файла?', text: `Текущие направления, новости, партнёры, тексты и контакты будут заменены содержимым «${f.name}».`, ok: 'Загрузить', danger: true }))) return;
      await store.importData(data);
      toast('Данные загружены');
    } catch (e) { toast(e instanceof SyntaxError ? 'Файл повреждён или не является JSON.' : (e as Error).message, 'error'); }
  };

  return (
    <>
      <PageTitle title="Данные и копии" desc="Выгрузка и загрузка всех направлений, новостей, текстов, контактов и обращений одним файлом." />
      <div className="space-y-6">
        <Panel title="Где хранятся данные">
          <p className="text-sm text-ink/75">Все данные хранятся в базе PostgreSQL на сервере компании. Правки из панели сразу видны всем посетителям. Файл ниже — дополнительная копия на случай переноса или восстановления; регулярные резервные копии базы настраиваются на сервере.</p>
        </Panel>
        <div className="grid gap-6 md:grid-cols-2">
          <Panel title="Выгрузить"><p className="text-sm text-ink/70">JSON-файл со всеми данными сайта. Подходит для переноса и как страховка. Файл содержит и обращения клиентов — храните его надёжно.</p><button className="btn-ink" onClick={exportAll}><Download size={16} />Скачать JSON</button></Panel>
          <Panel title="Загрузить"><p className="text-sm text-ink/70">Заменит текущие направления, новости, партнёров, тексты и контакты данными из файла.</p>
            <button className="btn-outline" onClick={() => file.current?.click()}><Upload size={16} />Выбрать JSON-файл</button>
            <input ref={file} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void importFile(f); }} />
          </Panel>
        </div>
      </div>
    </>
  );
}
