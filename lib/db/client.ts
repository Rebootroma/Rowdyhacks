import { Pool, QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;

export function getDbPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  if (!pool) {
    const isLocal =
      connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

    const cleanUrl = connectionString
      .replace(/([?&])sslmode=[^&]+(&|$)/, '$1')
      .replace(/[?&]$/, '');

    pool = new Pool({
      connectionString: cleanUrl,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle database client', err);
    });
  }

  return pool;
}

/**
 * Executes a parameterized query against Tiger Data / PostgreSQL.
 */
export async function queryDb<R extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<R> | null> {
  const p = getDbPool();
  if (!p) {
    return null;
  }

  return p.query<R>(text, params);
}

/**
 * Tests connection to Tiger Data / PostgreSQL.
 */
export async function checkDbConnection(): Promise<{ ok: boolean; message: string; version?: string }> {
  try {
    const res = await queryDb<{ version: string }>('SELECT version();');
    if (!res || res.rows.length === 0) {
      return { ok: false, message: 'DATABASE_URL not configured. Running in demo mode.' };
    }
    return { ok: true, message: 'Connected to Tiger Data / PostgreSQL', version: res.rows[0].version };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `Database connection failed: ${msg}` };
  }
}
