import fs from 'fs';
import { getDbPool } from '../lib/db/client';

async function runMigration() {
  const pool = getDbPool();
  if (!pool) {
    throw new Error('DATABASE_URL not set');
  }

  const client = await pool.connect();
  try {
    const rawSql = fs.readFileSync('CrewCash_V2_Build_Pack/CREWCASH_V2_TIGERDATA_SCHEMA.sql', 'utf8');

    // Split SQL statements cleanly, respecting comments and semicolons
    const cleanSql = rawSql
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');

    const statements = cleanSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`Executing ${statements.length} SQL statements on Tiger Data...`);

    for (let i = 0; i < statements.length; i++) {
      let stmt = statements[i];
      // For continuous aggregates in TimescaleDB, append WITH NO DATA if not present
      if (stmt.toUpperCase().includes('WITH (TIMESCALEDB.CONTINUOUS)') && !stmt.toUpperCase().includes('WITH NO DATA')) {
        stmt += ' WITH NO DATA';
      }

      try {
        await client.query(stmt);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        // Ignore "already exists" errors
        if (!msg.includes('already exists')) {
          console.warn(`Statement ${i + 1} warning:`, msg);
        }
      }
    }

    console.log('✅ Tiger Data Schema Migration Completed!');

    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\nActive Tables in Tiger Data:');
    console.table(tables.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
