import pg from 'pg';
import { config } from '../config.js';

const isNeon = config.DATABASE_URL.includes('neon.tech');
const poolConfig: pg.PoolConfig = {
  connectionString: config.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};
if (isNeon || config.NODE_ENV === 'production') {
  poolConfig.ssl = { rejectUnauthorized: true };
}

const pool = new pg.Pool(poolConfig);

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  if (config.NODE_ENV === 'development') {
    const duration = Date.now() - start;
    if (duration > 100) console.warn(`Slow query (${duration}ms):`, text.slice(0, 80));
  }
  return result;
}

export function getPool(): pg.Pool {
  return pool;
}

export async function closePool(): Promise<void> {
  await pool.end();
}
