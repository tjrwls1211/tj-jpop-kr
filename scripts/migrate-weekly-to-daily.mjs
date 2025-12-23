import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function migrate() {
  console.log('Starting migration: weekly_charts -> daily_charts\n');

  try {
    console.log('1. Creating daily_charts table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS daily_charts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        tj_number TEXT NOT NULL,
        rank INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tj_number) REFERENCES songs(tj_number)
      )
    `);

    console.log('2. Creating indexes...');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_date ON daily_charts(date)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_date_rank ON daily_charts(date, rank)');

    console.log('3. Copying data from weekly_charts to daily_charts...');
    const result = await client.execute(`
      INSERT INTO daily_charts (date, tj_number, rank, created_at)
      SELECT week, tj_number, rank, created_at
      FROM weekly_charts
    `);
    console.log(`   Copied ${result.rowsAffected} rows`);

    console.log('4. Dropping old weekly_charts table...');
    await client.execute('DROP TABLE IF EXISTS weekly_charts');

    console.log('\nMigration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
