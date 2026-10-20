import { migrate, pool, q } from '../src/db.js';
import { hashPassword, uid } from '../src/crypto.js';

const login = process.env.ADMIN_LOGIN || 'admin';
const password = process.env.ADMIN_PASSWORD || '';
if (password.length < 10) { console.error('Задайте ADMIN_PASSWORD (не короче 10 символов) в .env'); process.exit(1); }
await migrate();
const ex = await q('select id from users where lower(login) = lower($1)', [login]);
if (ex.rowCount) {
  await q('update users set password_hash = $2, token_version = token_version + 1, failed_attempts = 0, locked_until = null where id = $1', [ex.rows[0].id, await hashPassword(password)]);
  console.log(`Пароль пользователя «${login}» обновлён.`);
} else {
  await q("insert into users(id, login, name, role, password_hash) values ($1,$2,'Суперадминистратор','superadmin',$3)", [uid('u'), login, await hashPassword(password)]);
  console.log(`Суперадминистратор «${login}» создан. При первом входе будет предложено настроить код из приложения-аутентификатора.`);
}
await pool.end();
