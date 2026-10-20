import { useCallback, useState } from 'react';
import { clone } from '../store/utils';
import { store, useSite } from '../store/site';
import type { Settings } from '../types';
import { useDraft, useToast } from './ui';

/** Общая логика страниц «О компании», «Контакты»: черновик настроек → проверка → сохранение */
export function useSettingsForm(validate?: (s: Settings) => Settings | void) {
  const site = useSite();
  const { draft, update, reset, dirty } = useDraft<Settings>(clone(site.settings));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const toast = useToast();
  const set = useCallback((patch: Partial<Settings>) => update((s) => ({ ...s, ...patch })), [update]);
  const save = async (e?: { preventDefault: () => void }) => {
    e?.preventDefault();
    setErr('');
    try {
      const out = validate ? (validate(clone(draft)) ?? clone(draft)) : clone(draft);
      setSaving(true);
      await store.saveSettings(out);
      reset(clone(out));
      toast('Сохранено');
    } catch (ex) { setErr((ex as Error).message); window.scrollTo({ top: 0, behavior: 'smooth' }); } finally { setSaving(false); }
  };
  return { draft, set, dirty, saving, err, save };
}
