import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { config } from './config.js';

// bigint (count, extract) приходит строкой — приводим к числу; даты оставляем как есть
pg.types.setTypeParser(20, (v) => Number(v));

export const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10 });

export const q = <T extends pg.QueryResultRow = any>(text: string, params: unknown[] = []) => pool.query<T>(text, params);

export async function tx<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query('begin');
    const r = await fn(c);
    await c.query('commit');
    return r;
  } catch (e) {
    await c.query('rollback').catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

/** Применяет migrations/*.sql по порядку; уже применённые пропускает. */
export async function migrate(log = console.log) {
  await q('create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())');
  const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    const done = await q('select 1 from schema_migrations where name = $1', [f]);
    if (done.rowCount) continue;
    await tx(async (c) => {
      await c.query(readFileSync(join(dir, f), 'utf8'));
      await c.query('insert into schema_migrations(name) values ($1)', [f]);
    });
    log(`миграция применена: ${f}`);
  }
}
