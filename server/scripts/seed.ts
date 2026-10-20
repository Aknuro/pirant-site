import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { migrate, pool, q } from '../src/db.js';
import { importContent } from '../src/seed.js';

const force = process.argv.includes('--force');
await migrate();
const has = (await q('select count(*)::int n from directions')).rows[0].n > 0;
if (has && !force) { console.log('В базе уже есть направления. Для перезаписи: npm run seed -- --force'); await pool.end(); process.exit(0); }
const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'seed', 'seed.json');
await importContent(JSON.parse(readFileSync(file, 'utf8')), { withInquiries: false });
console.log('Начальное содержимое сайта загружено.');
await pool.end();
