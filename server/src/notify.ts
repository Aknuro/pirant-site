import nodemailer from 'nodemailer';
import { config } from './config.js';
import { q } from './db.js';

/**
 * Уведомления сотрудникам о новой заявке. В тексте НЕТ данных заявки (имя, телефон, сообщение):
 * только факт, что заявка пришла, и ссылка на админку.
 * Чтобы добавить канал (например, WhatsApp Business API), реализуйте функцию (text) => Promise<void>
 * и добавьте её в массив channels ниже.
 */
const TEXT = 'Новая заявка на сайте PIRANT. Откройте админку: ';

/* ------------------------------------------------ Telegram */
const tgApi = (method: string, body: object, signal?: AbortSignal) =>
  fetch(`https://api.telegram.org/bot${config.telegramToken}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal });

export async function sendTelegram(text: string): Promise<void> {
  if (!config.telegramToken) return;
  const { rows } = await q<{ chat_id: number }>("select chat_id from tg_recipients where status = 'approved'");
  await Promise.all(rows.map(async (r) => {
    try {
      const res = await tgApi('sendMessage', { chat_id: r.chat_id, text, disable_web_page_preview: true });
      if (!res.ok) console.error(`telegram: chat ${r.chat_id} → HTTP ${res.status}`);
    } catch (e) { console.error('telegram:', (e as Error).message); }
  }));
}

/** Бот работает через long polling — домен и вебхук не нужны. */
export async function startTelegramPolling() {
  if (!config.telegramToken) { console.log('Telegram: токен не задан — бот отключён'); return; }
  console.log('Telegram: бот запущен (long polling)');
  const getOffset = async () => Number((await q("select value from bot_state where key = 'tg_offset'")).rows[0]?.value ?? 0);
  const setOffset = (n: number) => q("insert into bot_state(key, value) values ('tg_offset', $1) on conflict (key) do update set value = excluded.value", [String(n)]);

  const addPending = async (chat: any) => {
    const label = chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(' ') || (chat.username ? `@${chat.username}` : String(chat.id));
    const r = await q('insert into tg_recipients(chat_id, label, kind) values ($1,$2,$3) on conflict (chat_id) do nothing returning chat_id', [chat.id, label, chat.type === 'private' ? 'private' : 'group']);
    return r.rowCount === 1;
  };

  for (;;) {
    try {
      const offset = await getOffset();
      const res = await tgApi('getUpdates', { offset, timeout: 30, allowed_updates: ['message', 'my_chat_member'] }, AbortSignal.timeout(45_000));
      const json: any = await res.json();
      if (!json.ok) { console.error('telegram getUpdates:', json.description); await new Promise((r) => setTimeout(r, 10_000)); continue; }
      for (const u of json.result as any[]) {
        const msg = u.message;
        if (msg?.text?.startsWith('/start')) {
          const isNew = await addPending(msg.chat);
          const row = (await q('select status from tg_recipients where chat_id = $1', [msg.chat.id])).rows[0];
          const reply = row?.status === 'approved'
            ? 'Вы уже подключены: уведомления о новых заявках будут приходить сюда.'
            : isNew ? 'Запрос отправлен администратору сайта. Когда его одобрят в панели управления, сюда начнут приходить уведомления о новых заявках.' : 'Запрос уже отправлен и ждёт одобрения администратора.';
          await tgApi('sendMessage', { chat_id: msg.chat.id, text: reply }).catch(() => {});
        }
        const mcm = u.my_chat_member;
        if (mcm && ['group', 'supergroup'].includes(mcm.chat.type) && ['member', 'administrator'].includes(mcm.new_chat_member?.status)) await addPending(mcm.chat);
        if (mcm && ['left', 'kicked'].includes(mcm.new_chat_member?.status)) await q('delete from tg_recipients where chat_id = $1', [mcm.chat.id]);
        await setOffset(u.update_id + 1);
      }
    } catch (e) {
      console.error('telegram polling:', (e as Error).message);
      await new Promise((r) => setTimeout(r, 10_000));
    }
  }
}

/* ------------------------------------------------ Почта */
let mailer: nodemailer.Transporter | null = null;
export async function sendMail(subject: string, text: string): Promise<void> {
  if (!config.smtp.host || !config.notifyEmails.length) return;
  mailer ??= nodemailer.createTransport({ host: config.smtp.host, port: config.smtp.port, secure: config.smtp.secure, auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined });
  try { await mailer.sendMail({ from: config.smtp.from, to: config.notifyEmails, subject, text }); }
  catch (e) { console.error('mail:', (e as Error).message); }
}

/* ------------------------------------------------ точка входа */
export async function notifyNewInquiry(): Promise<void> {
  const link = `${config.publicUrl}/admin/inquiries?status=new`;
  const channels: Array<() => Promise<void>> = [
    () => sendTelegram(TEXT + link),
    () => sendMail('Новая заявка на сайте PIRANT', `${TEXT}${link}\n\nВ письме нет данных заявки — они доступны только в панели управления.`),
    // () => sendWhatsApp(TEXT + link),   ← подключить после оформления WhatsApp Business API
  ];
  await Promise.allSettled(channels.map((c) => c()));
}
