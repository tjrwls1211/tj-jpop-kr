import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env.local 파일 로드
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Turso 연결 정보
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in environment variables');
  process.exit(1);
}

// Turso 클라이언트 생성
const turso = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN,
});

// 로컬 SQLite 연결
const localDbPath = path.join(__dirname, '..', 'data', 'songs.db');
const localDb = new Database(localDbPath);

async function createSchema() {
  console.log('\n📋 Creating Turso database schema...');

  const schemaPath = path.join(__dirname, '..', 'data', 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  // 스키마를 개별 SQL 문으로 분리
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    await turso.execute(statement);
  }

  console.log('Schema created successfully');
}

async function migrateSongs() {
  console.log('\nMigrating songs data...');

  const songs = localDb.prepare('SELECT * FROM songs').all();
  console.log(`Found ${songs.length} songs to migrate`);

  for (const song of songs) {
    await turso.execute({
      sql: `
        INSERT INTO songs (
          id, tj_number, title_ja, title_ko_main, title_ko_auto, title_ko_llm,
          artist_ja, artist_ko, is_confirmed, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        song.id,
        song.tj_number,
        song.title_ja,
        song.title_ko_main,
        song.title_ko_auto,
        song.title_ko_llm,
        song.artist_ja,
        song.artist_ko,
        song.is_confirmed,
        song.created_at,
        song.updated_at,
      ],
    });
  }

  console.log(`Migrated ${songs.length} songs`);
}

async function migrateWeeklyCharts() {
  console.log('\nMigrating weekly charts data...');

  const charts = localDb.prepare('SELECT * FROM weekly_charts').all();
  console.log(`Found ${charts.length} chart entries to migrate`);

  for (const chart of charts) {
    await turso.execute({
      sql: `
        INSERT INTO weekly_charts (
          id, week, tj_number, rank, created_at
        ) VALUES (?, ?, ?, ?, ?)
      `,
      args: [
        chart.id,
        chart.week,
        chart.tj_number,
        chart.rank,
        chart.created_at,
      ],
    });
  }

  console.log(`Migrated ${charts.length} chart entries`);
}

async function migrateLlmUsage() {
  console.log('\nMigrating LLM usage data...');

  try {
    const llmUsage = localDb.prepare('SELECT * FROM llm_usage').all();
    console.log(`Found ${llmUsage.length} LLM usage entries to migrate`);

    for (const usage of llmUsage) {
      await turso.execute({
        sql: `
          INSERT INTO llm_usage (day, count, created_at)
          VALUES (?, ?, ?)
        `,
        args: [usage.day, usage.count, usage.created_at],
      });
    }

    console.log(`Migrated ${llmUsage.length} LLM usage entries`);
  } catch (error) {
    if (error.message.includes('no such table')) {
      console.log('llm_usage table does not exist in local database, skipping...');
    } else {
      throw error;
    }
  }
}

async function verifyMigration() {
  console.log('\nVerifying migration...');

  const songsCount = await turso.execute('SELECT COUNT(*) as count FROM songs');
  const chartsCount = await turso.execute('SELECT COUNT(*) as count FROM weekly_charts');

  console.log(`Songs in Turso: ${songsCount.rows[0].count}`);
  console.log(`Charts in Turso: ${chartsCount.rows[0].count}`);

  console.log('Migration verification complete');
}

async function main() {
  console.log('Starting Turso migration...');
  console.log(`Source: ${localDbPath}`);
  console.log(`Target: ${TURSO_URL}`);

  try {
    await createSchema();
    await migrateSongs();
    await migrateWeeklyCharts();
    await migrateLlmUsage();
    await verifyMigration();

    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('\nMigration failed:', error);
    process.exit(1);
  } finally {
    localDb.close();
  }
}

main();
