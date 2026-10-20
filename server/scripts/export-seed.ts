// Пересобирает seed/seed.json из фронтенда (src/data/*). Нужно только если меняли mock-данные.
import { writeFileSync } from 'node:fs';
import { buildSeed } from '../../src/store/seed.js';
const s: any = buildSeed(); s.inquiries = [];
writeFileSync(new URL('../seed/seed.json', import.meta.url), JSON.stringify(s, null, 2));
console.log('seed/seed.json обновлён');
