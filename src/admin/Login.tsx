import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import Logo from '../components/layout/Logo';
import { ApiError } from '../store/api';
import { store } from '../store/site';
import type { PublicUser } from '../types';
import { Field, TextInput } from './ui';

type Stage =
  | { name: 'password' }
  | { name: 'totp'; challenge: string }
  | { name: 'setup'; challenge: string; secret: string; qr: string }
  | { name: 'codes'; user: PublicUser; codes: string[] };

const alertCls = 'rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800';

export default function Login() {
  const [stage, setStage] = useState<Stage>({ name: 'password' });
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { document.title = 'Вход — панель управления PIRANT'; }, []);

  const restart = (msg = '') => { setStage({ name: 'password' }); setPassword(''); setCode(''); setError(msg); };
  const fail = (ex: unknown) => {
    const e = ex as ApiError;
    if (e.data?.restart) return restart(e.message);
    setError(e.message); setCode('');
  };

  const submitPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !password) { setError('Введите логин и пароль.'); return; }
    setBusy(true); setError('');
    try {
      const r = await store.login(login, password);
      if (r.step === 'totp') setStage({ name: 'totp', challenge: r.challenge });
      else if (r.step === 'setup') { const s = await store.setupTotp(r.challenge); setStage({ name: 'setup', challenge: r.challenge, ...s }); }
      setPassword('');
    } catch (ex) { setError((ex as Error).message); setPassword(''); } finally { setBusy(false); }
  };

  const submitTotp = async (e: FormEvent) => {
    e.preventDefault();
    if (stage.name !== 'totp') return;
    if (!code.trim()) { setError('Введите код.'); return; }
    setBusy(true); setError('');
    try { await store.verifyTotp(stage.challenge, code); } catch (ex) { fail(ex); } finally { setBusy(false); }
  };

  const submitSetup = async (e: FormEvent) => {
    e.preventDefault();
    if (stage.name !== 'setup') return;
    setBusy(true); setError('');
    try {
      const r = await store.enableTotp(stage.challenge, code.replace(/\s/g, ''));
      setStage({ name: 'codes', user: r.user, codes: r.backupCodes }); setCode('');
    } catch (ex) { fail(ex); } finally { setBusy(false); }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-navy-900 p-4">
      <div aria-hidden className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_20%_10%,rgba(23,71,214,0.35),transparent_50%),radial-gradient(circle_at_85%_90%,rgba(242,140,27,0.18),transparent_45%)]" />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl sm:p-9">
        <Logo />

        {stage.name === 'password' && (
          <>
            <h1 className="mt-6 text-2xl font-extrabold text-navy">Вход в панель управления</h1>
            <p className="mt-1 text-sm text-ink/65">Направления, новости, обращения и контакты сайта.</p>
            <form onSubmit={submitPassword} className="mt-6 space-y-4" noValidate>
              {error && <div role="alert" className={alertCls}>{error}</div>}
              <Field label="Логин" htmlFor="login"><TextInput id="login" value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" autoFocus /></Field>
              <Field label="Пароль" htmlFor="password">
                <div className="relative">
                  <TextInput id="password" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="!pr-11" />
                  <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Скрыть пароль' : 'Показать пароль'} aria-pressed={show} className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-navy/60 hover:bg-brand-soft">
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </Field>
              <button type="submit" disabled={busy} className="btn-accent w-full disabled:opacity-60"><Lock size={16} />{busy ? 'Проверяем…' : 'Войти'}</button>
            </form>
          </>
        )}

        {stage.name === 'totp' && (
          <>
            <h1 className="mt-6 text-2xl font-extrabold text-navy">Код подтверждения</h1>
            <p className="mt-1 text-sm text-ink/65">Введите 6-значный код из приложения-аутентификатора. Если телефона нет под рукой — один из резервных кодов.</p>
            <form onSubmit={submitTotp} className="mt-6 space-y-4" noValidate>
              {error && <div role="alert" className={alertCls}>{error}</div>}
              <Field label="Код" htmlFor="code"><TextInput id="code" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" inputMode="text" autoFocus /></Field>
              <button type="submit" disabled={busy} className="btn-accent w-full disabled:opacity-60"><ShieldCheck size={16} />{busy ? 'Проверяем…' : 'Подтвердить'}</button>
              <button type="button" onClick={() => restart()} className="block w-full text-center text-sm font-semibold text-brand hover:underline">Начать сначала</button>
            </form>
          </>
        )}

        {stage.name === 'setup' && (
          <>
            <h1 className="mt-6 text-2xl font-extrabold text-navy">Настройка двухфакторной защиты</h1>
            <p className="mt-1 text-sm text-ink/65">Установите на телефон приложение-аутентификатор (Google Authenticator, Microsoft Authenticator, Aegis и т. п.), отсканируйте QR-код и введите показанный код.</p>
            <form onSubmit={submitSetup} className="mt-5 space-y-4" noValidate>
              {error && <div role="alert" className={alertCls}>{error}</div>}
              <div className="flex flex-col items-center gap-2 rounded-xl bg-brand-soft p-4">
                <img src={stage.qr} alt="QR-код для приложения-аутентификатора" width={200} height={200} className="rounded-lg bg-white" />
                <p className="text-xs text-ink/65">Не получается сканировать? Введите ключ вручную:</p>
                <code className="select-all break-all rounded bg-white px-2 py-1 text-xs font-bold text-navy">{stage.secret}</code>
              </div>
              <Field label="Код из приложения" htmlFor="code"><TextInput id="code" value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" autoFocus /></Field>
              <button type="submit" disabled={busy} className="btn-accent w-full disabled:opacity-60"><ShieldCheck size={16} />{busy ? 'Проверяем…' : 'Включить защиту'}</button>
            </form>
          </>
        )}

        {stage.name === 'codes' && (
          <>
            <h1 className="mt-6 text-2xl font-extrabold text-navy">Резервные коды</h1>
            <p className="mt-1 text-sm text-ink/65">Сохраните эти коды в надёжном месте. Каждый подходит один раз вместо кода из приложения — на случай потери телефона. <b>Повторно они показаны не будут.</b></p>
            <ul className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-brand-soft p-4 font-mono text-sm font-bold text-navy">
              {stage.codes.map((c) => <li key={c} className="select-all">{c}</li>)}
            </ul>
            <button type="button" className="btn-outline mt-3 w-full" onClick={() => void navigator.clipboard?.writeText(stage.codes.join('\n'))}><Copy size={16} />Скопировать</button>
            <label className="mt-4 flex items-start gap-2 text-sm"><input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="mt-0.5" />Я сохранил(а) резервные коды</label>
            <button type="button" disabled={!saved} onClick={() => void store.confirmSession(stage.user)} className="btn-accent mt-4 w-full disabled:opacity-50">Перейти в панель</button>
          </>
        )}

        <Link to="/" className="mt-5 block text-center text-sm font-semibold text-brand hover:underline">Вернуться на сайт</Link>
      </div>
    </main>
  );
}
