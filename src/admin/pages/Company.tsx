import { ui } from '../../i18n/ui';
import { uid } from '../../store/utils';
import type { EditableTextKey, Localized } from '../../types';
import { Field, IconSelect, LocalizedField, PageTitle, Panel, RowsEditor, SaveBar, TextInput } from '../ui';
import { useSettingsForm } from '../settingsForm';

const TEXT_LABELS: Record<EditableTextKey, { label: string; multiline?: boolean; hint?: string }> = {
  heroTitle: { label: 'Заголовок первого экрана', hint: 'Большая надпись на главной.' },
  heroSubtitle: { label: 'Подзаголовок первого экрана', multiline: true },
  trust: { label: 'Строка доверия', hint: 'Подзаголовок страницы «О компании».' },
  aboutText: { label: 'Описание компании', multiline: true },
  missionText: { label: 'Миссия', multiline: true },
  slogan: { label: 'Девиз', hint: 'Внизу страницы «Контакты».' },
  servicesLead: { label: 'Вступление к блоку «Наши направления»', multiline: true },
  partnersTitle: { label: 'Заголовок блока производителей на главной' },
  orderText: { label: 'Текст призыва к заявке (синяя полоса)', multiline: true },
};
const GROUPS: { title: string; keys: EditableTextKey[] }[] = [
  { title: 'Первый экран', keys: ['heroTitle', 'heroSubtitle'] },
  { title: 'О компании', keys: ['aboutText', 'missionText', 'trust', 'slogan'] },
  { title: 'Другие тексты на сайте', keys: ['servicesLead', 'partnersTitle', 'orderText'] },
];

export default function Company() {
  const { draft, set, dirty, saving, err, save } = useSettingsForm((s) => {
    s.stats = s.stats.filter((x) => x.value.trim() || x.label.ru.trim());
    s.advantages = s.advantages.filter((x) => x.title.ru.trim());
    s.cycle = s.cycle.filter((x) => x.title.trim());
    return s;
  });
  /** Показываем действующий текст: значение из панели поверх значения по умолчанию */
  const effective = (k: EditableTextKey): Localized => ({ ...(ui[k] as Localized), ...(draft.texts[k] ?? {}) });

  return (
    <form onSubmit={save} noValidate>
      <PageTitle title="О компании" desc="Тексты первого экрана и блока «О компании», принципы, показатели и этапы работ. Переводы на казахский и английский — на вкладках КАЗ / EN." />
      {err && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{err}</div>}
      <div className="space-y-6">
        {GROUPS.map((g) => (
          <Panel key={g.title} title={g.title}>
            {g.keys.map((k) => (
              <LocalizedField key={k} label={TEXT_LABELS[k].label} hint={TEXT_LABELS[k].hint} multiline={TEXT_LABELS[k].multiline}
                value={effective(k)} onChange={(v) => set({ texts: { ...draft.texts, [k]: v } })} />
            ))}
          </Panel>
        ))}

        <Panel title="Принципы" desc="Четыре пункта в блоке «О компании».">
          <RowsEditor rows={draft.advantages} onChange={(advantages) => set({ advantages })} addText="Добавить принцип"
            blank={() => ({ id: uid('adv'), icon: 'check', title: { ru: '' }, text: { ru: '' } })}
            render={(a, i, setA) => (
              <div className="grid gap-3 lg:grid-cols-[230px_1fr]">
                <Field label="Иконка"><IconSelect value={a.icon} onChange={(icon) => setA({ icon })} label={`Иконка принципа ${i + 1}`} /></Field>
                <div className="space-y-3">
                  <LocalizedField label="Заголовок" value={a.title} onChange={(title) => setA({ title })} />
                  <LocalizedField label="Описание" value={a.text} onChange={(text) => setA({ text })} multiline rows={2} />
                </div>
              </div>
            )} />
        </Panel>

        <Panel title="Показатели" desc="Цифры под первым экраном.">
          <RowsEditor rows={draft.stats} onChange={(stats) => set({ stats })} addText="Добавить показатель"
            blank={() => ({ id: uid('stat'), value: '', label: { ru: '' } })}
            render={(s, i, setS) => (
              <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
                <Field label="Значение"><TextInput value={s.value} onChange={(e) => setS({ value: e.target.value })} placeholder="20+" aria-label={`Значение ${i + 1}`} /></Field>
                <LocalizedField label="Подпись" value={s.label} onChange={(label) => setS({ label })} placeholder="лет на рынке" />
              </div>
            )} />
        </Panel>

        <Panel title="Полный цикл реализации проектов" desc="Этапы по порядку: главная, «О компании» и схемы направлений без собственной схемы.">
          <RowsEditor rows={draft.cycle} onChange={(cycle) => set({ cycle })} addText="Добавить этап"
            blank={() => ({ id: uid('cyc'), icon: 'check', title: '', text: '' })}
            render={(c, i, setC) => (
              <div className="grid gap-3 lg:grid-cols-[230px_1fr]">
                <Field label="Иконка"><IconSelect value={c.icon} onChange={(icon) => setC({ icon })} label={`Иконка этапа ${i + 1}`} /></Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Этап"><TextInput value={c.title} onChange={(e) => setC({ title: e.target.value })} /></Field>
                  <Field label="Описание"><TextInput value={c.text} onChange={(e) => setC({ text: e.target.value })} /></Field>
                </div>
              </div>
            )} />
        </Panel>
      </div>
      <SaveBar dirty={dirty} saving={saving} />
    </form>
  );
}
