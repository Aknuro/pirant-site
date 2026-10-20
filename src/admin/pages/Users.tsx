import { useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { store, useSession, useUsers } from '../../store/site';
import type { PublicUser, Role } from '../../types';
import { ROLE_NAMES } from '../AdminLayout';
import { Field, Modal, PageTitle, Panel, Pill, Select, TextInput, useConfirm, useToast } from '../ui';

function UserForm({ user, onClose }: { user: PublicUser | null; onClose: () => void }) {
  const [name, setName] = useState(user?.name ?? '');
  const [login, setLogin] = useState(user?.login ?? '');
  const [role, setRole] = useState<Role>(user?.role ?? 'manager');
  const [password, setPassword] = useState('');
  const [reset2fa, setReset2fa] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await store.saveUser({ id: user?.id, name, login, role, password, reset2fa }); toast(user ? 'Пользователь сохранён' : 'Пользователь добавлен'); onClose(); }
    catch (ex) { setErr((ex as Error).message); } finally { setBusy(false); }
  };
  return (
    <Modal title={user ? `Пользователь ${user.login}` : 'Новый пользователь'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {err && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{err}</div>}
        <Field label="Имя"><TextInput value={name} onChange={(e) => setName(e.target.value)} autoFocus /></Field>
        <Field label="Логин *"><TextInput value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="off" /></Field>
        <Field label="Роль"><Select value={role} onChange={(e) => setRole(e.target.value as Role)}><option value="manager">{ROLE_NAMES.manager}</option><option value="superadmin">{ROLE_NAMES.superadmin}</option></Select></Field>
        <Field label={user ? 'Новый пароль' : 'Пароль *'} hint={`${user ? 'Оставьте пустым, чтобы не менять. ' : ''}Не короче 10 символов.`}><TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></Field>
        {user && <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={reset2fa} onChange={(e) => setReset2fa(e.target.checked)} className="mt-0.5" />Сбросить двухфакторную защиту (пользователь настроит её заново при входе, например после потери телефона и резервных кодов)</label>}
        <div className="flex justify-end gap-2 pt-2"><button type="button" className="btn-outline" onClick={onClose}>Отмена</button><button type="submit" className="btn-accent" disabled={busy}>Сохранить</button></div>
      </form>
    </Modal>
  );
}

export default function Users() {
  const users = useUsers();
  const me = useSession()!;
  const confirm = useConfirm();
  const toast = useToast();
  const [form, setForm] = useState<{ user: PublicUser | null } | null>(null);
  const del = async (u: PublicUser) => {
    if (!(await confirm({ title: 'Удалить пользователя?', text: `${u.login} больше не сможет войти в панель управления.`, ok: 'Удалить', danger: true }))) return;
    try { await store.deleteUser(u.id); toast('Пользователь удалён'); } catch (e) { toast((e as Error).message, 'error'); }
  };
  return (
    <>
      <PageTitle title="Пользователи" desc="Суперадминистратор управляет всем; менеджер контента — направлениями, новостями и обращениями."
        actions={<button className="btn-accent" onClick={() => setForm({ user: null })}><Plus size={16} />Добавить пользователя</button>} />
      <Panel>
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-ink/50"><tr><th className="py-2">Имя</th><th className="py-2">Логин</th><th className="py-2">Роль</th><th className="py-2"><span className="sr-only">Действия</span></th></tr></thead>
            <tbody className="divide-y divide-navy/10">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-3 font-semibold text-navy">{u.name} {u.id === me.id && <Pill tone="ok">Вы</Pill>}</td>
                  <td className="py-3">{u.login}</td><td className="py-3">{ROLE_NAMES[u.role]} {u.totp ? <Pill tone="ok">2FA</Pill> : <Pill>2FA не настроена</Pill>}</td>
                  <td className="py-3"><div className="flex justify-end gap-1">
                    <button className="icon-btn" onClick={() => setForm({ user: u })} aria-label={`Изменить ${u.login}`}><Pencil size={16} /></button>
                    {u.id !== me.id && <button className="icon-btn icon-btn-danger" onClick={() => del(u)} aria-label={`Удалить ${u.login}`}><Trash2 size={16} /></button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="rounded-lg bg-brand-soft p-3 text-xs text-ink/70"><b className="text-navy">Важно.</b> Новый пользователь при первом входе настроит код из приложения-аутентификатора. При смене пароля или роли его активные сессии завершаются.</p>
      </Panel>
      {form && <UserForm user={form.user} onClose={() => setForm(null)} />}
    </>
  );
}
