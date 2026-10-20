import { Plus, Trash2 } from 'lucide-react';
import { digits, uid } from '../../store/utils';
import { Field, FormGrid, LocalizedField, PageTitle, Panel, RowsEditor, SaveBar, TextInput } from '../ui';
import { useSettingsForm } from '../settingsForm';

export default function Contacts() {
  const { draft, set, dirty, saving, err, save } = useSettingsForm((s) => {
    s.phones = s.phones.filter((p) => digits(p.number).length >= 10);
    if (!s.phones.length) throw new Error('Укажите хотя бы один телефон полностью, например +7 778 800 44 77.');
    if (digits(s.whatsapp).length < 10) throw new Error('Проверьте номер WhatsApp: нужны все цифры, включая код страны.');
    if (!/^\S+@\S+\.\S+$/.test(s.email.trim())) throw new Error('Проверьте адрес электронной почты.');
    s.whatsapp = digits(s.whatsapp);
    return s;
  });
  return (
    <form onSubmit={save} noValidate>
      <PageTitle title="Контакты и мессенджеры" desc="Телефоны, WhatsApp, почта и офисы, которые видят посетители сайта." />
      {err && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{err}</div>}
      <div className="space-y-6">
        <Panel title="Мессенджеры и почта">
          <FormGrid>
            <Field label="Номер WhatsApp" hint="Кнопки WhatsApp на сайте открывают чат с этим номером. Формат: 77788004477."><TextInput inputMode="tel" value={draft.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} /></Field>
            <Field label="Email на сайте"><TextInput type="email" value={draft.email} onChange={(e) => set({ email: e.target.value })} /></Field>
            <Field label="Адрес сайта"><TextInput value={draft.site} onChange={(e) => set({ site: e.target.value })} placeholder="https://pirant.kz/" /></Field>
            <Field label="Часы работы (необязательно)" hint="Если пусто — не показываются." span><TextInput value={draft.workHours} onChange={(e) => set({ workHours: e.target.value })} placeholder="Пн–Пт, 9:00–18:00" /></Field>
          </FormGrid>
        </Panel>

        <Panel title="Телефоны" desc="В шапке показывается первый телефон; нажатие открывает звонок.">
          <RowsEditor rows={draft.phones} onChange={(phones) => set({ phones })} addText="Добавить телефон" blank={() => ({ id: uid('ph'), label: '', number: '' })}
            render={(p, i, setP) => (
              <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
                <TextInput value={p.label} onChange={(e) => setP({ label: e.target.value })} placeholder="Подпись: Основной" aria-label={`Подпись телефона ${i + 1}`} />
                <TextInput inputMode="tel" value={p.number} onChange={(e) => setP({ number: e.target.value })} placeholder="+7 7XX XXX XX XX" aria-label={`Номер ${i + 1}`} />
              </div>
            )} />
        </Panel>

        <Panel title="Офисы" desc="Адреса на странице «Контакты» и в подвале. «Строка для карты» — адрес, по которому ищется точка на карте."
          actions={<button type="button" className="btn-outline btn-sm" onClick={() => set({ offices: [...draft.offices, { id: uid('office'), city: { ru: '' }, address: '', mapQuery: '', phone: '' }] })}><Plus size={14} />Добавить офис</button>}>
          {draft.offices.length === 0 && <p className="text-sm text-ink/60">Офисов нет. Добавьте хотя бы один, чтобы показать адрес и карту.</p>}
          {draft.offices.map((o, i) => {
            const setO = (patch: Partial<typeof o>) => set({ offices: draft.offices.map((x, k) => (k === i ? { ...x, ...patch } : x)) });
            return (
              <div key={o.id} className="rounded-2xl border border-navy/15 bg-brand-soft/40 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-bold text-navy">{o.city.ru || `Офис ${i + 1}`}</h3>
                  <button type="button" className="btn-danger btn-sm" onClick={() => set({ offices: draft.offices.filter((_, k) => k !== i) })}><Trash2 size={14} />Удалить офис</button>
                </div>
                <FormGrid>
                  <LocalizedField label="Город" value={o.city} onChange={(city) => setO({ city })} />
                  <Field label="Телефон офиса"><TextInput inputMode="tel" value={o.phone} onChange={(e) => setO({ phone: e.target.value })} /></Field>
                  <Field label="Адрес" span><TextInput value={o.address} onChange={(e) => setO({ address: e.target.value })} /></Field>
                  <Field label="Строка для карты" hint="Город, улица, дом — так карта найдёт точку." span><TextInput value={o.mapQuery} onChange={(e) => setO({ mapQuery: e.target.value })} placeholder="Алматы, улица Туркебаева 257А" /></Field>
                </FormGrid>
              </div>
            );
          })}
        </Panel>
      </div>
      <SaveBar dirty={dirty} saving={saving} />
    </form>
  );
}
