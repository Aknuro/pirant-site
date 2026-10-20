import { migrate, pool } from '../src/db.js';
await migrate(); console.log('Миграции применены.'); await pool.end();
