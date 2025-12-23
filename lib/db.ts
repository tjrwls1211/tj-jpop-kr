import Database from 'better-sqlite3';
import { createClient } from '@libsql/client';
import path from 'path';


interface DbAdapter {
  execute(sql: string, params?: any[]): Promise<any>;
  all(sql: string, params?: any[]): Promise<any[]>;
  get(sql: string, params?: any[]): Promise<any | undefined>;
  run(sql: string, params?: any[]): Promise<any>;
}

// Turso 어댑터
class TursoAdapter implements DbAdapter {
  private client: ReturnType<typeof createClient>;

  constructor(url: string, authToken: string) {
    this.client = createClient({ url, authToken });
  }

  async execute(sql: string, params: any[] = []) {
    return await this.client.execute({ sql, args: params });
  }

  async all(sql: string, params: any[] = []) {
    const result = await this.client.execute({ sql, args: params });
    return result.rows as any[];
  }

  async get(sql: string, params: any[] = []) {
    const result = await this.client.execute({ sql, args: params });
    return result.rows[0] as any | undefined;
  }

  async run(sql: string, params: any[] = []) {
    const result = await this.client.execute({ sql, args: params });
    return result;
  }
}

// 로컬 SQLite 어댑터
class LocalSqliteAdapter implements DbAdapter {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
  }

  async execute(sql: string, params: any[] = []) {
    return this.db.prepare(sql).run(...params);
  }

  async all(sql: string, params: any[] = []) {
    return this.db.prepare(sql).all(...params);
  }

  async get(sql: string, params: any[] = []) {
    return this.db.prepare(sql).get(...params);
  }

  async run(sql: string, params: any[] = []) {
    return this.db.prepare(sql).run(...params);
  }
}

// 데이터베이스 어댑터 인스턴스 관리
let dbAdapter: DbAdapter | null = null;
let llmUsageTableInitialized = false;

function getDbAdapter(): DbAdapter {
  if (!dbAdapter) {
    const tursoUrl = process.env.TURSO_DATABASE_URL;
    const tursoToken = process.env.TURSO_AUTH_TOKEN;

    if (tursoUrl && tursoToken) {
      dbAdapter = new TursoAdapter(tursoUrl, tursoToken);
    } else {
      const dbPath = path.join(process.cwd(), 'data', 'songs.db');
      dbAdapter = new LocalSqliteAdapter(dbPath);
    }
  }
  return dbAdapter;
}

async function ensureLlmUsageTable() {
  if (llmUsageTableInitialized) return;
  const db = getDbAdapter();
  await db.run(
    `
    CREATE TABLE IF NOT EXISTS llm_usage (
      day TEXT PRIMARY KEY,
      count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
    []
  );
  llmUsageTableInitialized = true;
}

function formatToday() {
  return new Date().toISOString().slice(0, 10);
}

export async function getLatestDate(): Promise<string | null> {
  const db = getDbAdapter();
  const result = (await db.get('SELECT MAX(date) as latest_date FROM daily_charts', [])) as
    | { latest_date: string | null }
    | undefined;
  return result?.latest_date || null;
}

export async function getConfirmedSongsByRange(start: number, end: number) {
  const db = getDbAdapter();
  const latestDate = await getLatestDate();

  if (!latestDate) return [];

  return await db.all(
    `
    SELECT
      s.*,
      d.rank,
      d.date
    FROM songs s
    INNER JOIN daily_charts d ON s.tj_number = d.tj_number
    WHERE s.is_confirmed = 1
      AND d.date = ?
      AND d.rank >= ?
      AND d.rank <= ?
    ORDER BY d.rank ASC
  `,
    [latestDate, start, end]
  );
}

export async function searchSongs(query: string) {
  const db = getDbAdapter();
  const latestDate = await getLatestDate();

  if (!latestDate) return [];

  const searchPattern = `%${query}%`;
  return await db.all(
    `
    SELECT
      s.*,
      d.rank,
      d.date
    FROM songs s
    INNER JOIN daily_charts d ON s.tj_number = d.tj_number
    WHERE s.is_confirmed = 1
      AND d.date = ?
      AND (
        s.title_ko_main LIKE ? OR
        s.title_ko_auto LIKE ? OR
        s.title_ko_llm LIKE ? OR
        s.title_ja LIKE ? OR
        s.artist_ko LIKE ? OR
        s.artist_ja LIKE ?
      )
    ORDER BY d.rank ASC
  `,
    [
      latestDate,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
    ]
  );
}

export async function getPendingSongs() {
  const db = getDbAdapter();
  const latestDate = await getLatestDate();

  if (!latestDate) return [];

  return await db.all(
    `
    SELECT
      s.*,
      d.rank,
      d.date
    FROM songs s
    LEFT JOIN daily_charts d ON s.tj_number = d.tj_number AND d.date = ?
    WHERE s.is_confirmed = 0
    ORDER BY d.rank ASC
  `,
    [latestDate]
  );
}

export async function getSongByTjNumber(tjNumber: string) {
  const db = getDbAdapter();
  return await db.get(
    `
    SELECT *
    FROM songs
    WHERE tj_number = ?
  `,
    [tjNumber]
  );
}

export async function setSongLlm(tjNumber: string, titleKoLlm: string) {
  const db = getDbAdapter();
  return await db.run(
    `
    UPDATE songs
    SET title_ko_llm = ?, updated_at = CURRENT_TIMESTAMP
    WHERE tj_number = ?
  `,
    [titleKoLlm, tjNumber]
  );
}

export async function getLlmUsage(day?: string): Promise<number> {
  await ensureLlmUsageTable();
  const db = getDbAdapter();
  const targetDay = day || formatToday();
  const row = (await db.get(
    `
    SELECT count FROM llm_usage WHERE day = ?
  `,
    [targetDay]
  )) as { count: number } | undefined;
  return row?.count ?? 0;
}

export async function incrementLlmUsage(day?: string) {
  await ensureLlmUsageTable();
  const db = getDbAdapter();
  const targetDay = day || formatToday();
  await db.run(
    `
    INSERT INTO llm_usage(day, count)
    VALUES (?, 1)
    ON CONFLICT(day) DO UPDATE SET count = llm_usage.count + 1
  `,
    [targetDay]
  );
}

export async function confirmSong(id: number, titleKoMain: string) {
  const db = getDbAdapter();
  return await db.run(
    `
    UPDATE songs
    SET title_ko_main = ?, is_confirmed = 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,
    [titleKoMain, id]
  );
}
