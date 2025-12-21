import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'songs.db');
let db: Database.Database | null = null;
let llmUsageTableInitialized = false;

export function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

function ensureLlmUsageTable() {
  if (llmUsageTableInitialized) return;
  const db = getDb();
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS llm_usage (
      day TEXT PRIMARY KEY,
      count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `
  ).run();
  llmUsageTableInitialized = true;
}

function formatToday() {
  return new Date().toISOString().slice(0, 10);
}

export function getLatestWeek(): string | null {
  const db = getDb();
  const result = db
    .prepare('SELECT MAX(week) as latest_week FROM weekly_charts')
    .get() as { latest_week: string | null };
  return result.latest_week;
}

export function getConfirmedSongsByRange(start: number, end: number) {
  const db = getDb();
  const latestWeek = getLatestWeek();

  if (!latestWeek) return [];

  return db
    .prepare(
      `
    SELECT
      s.*,
      w.rank,
      w.week
    FROM songs s
    INNER JOIN weekly_charts w ON s.tj_number = w.tj_number
    WHERE s.is_confirmed = 1
      AND w.week = ?
      AND w.rank >= ?
      AND w.rank <= ?
    ORDER BY w.rank ASC
  `
    )
    .all(latestWeek, start, end);
}

export function searchSongs(query: string) {
  const db = getDb();
  const latestWeek = getLatestWeek();

  if (!latestWeek) return [];

  const searchPattern = `%${query}%`;
  return db
    .prepare(
      `
    SELECT
      s.*,
      w.rank,
      w.week
    FROM songs s
    INNER JOIN weekly_charts w ON s.tj_number = w.tj_number
    WHERE s.is_confirmed = 1
      AND w.week = ?
      AND (
        s.title_ko_main LIKE ? OR
        s.title_ko_auto LIKE ? OR
        s.title_ko_llm LIKE ? OR
        s.title_ja LIKE ? OR
        s.artist_ko LIKE ? OR
        s.artist_ja LIKE ?
      )
    ORDER BY w.rank ASC
  `
    )
    .all(
      latestWeek,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern
    );
}

export function getPendingSongs() {
  const db = getDb();
  const latestWeek = getLatestWeek();

  if (!latestWeek) return [];

  return db
    .prepare(
      `
    SELECT
      s.*,
      w.rank,
      w.week
    FROM songs s
    LEFT JOIN weekly_charts w ON s.tj_number = w.tj_number AND w.week = ?
    WHERE s.is_confirmed = 0
    ORDER BY w.rank ASC
  `
    )
    .all(latestWeek);
}

export function getSongByTjNumber(tjNumber: string) {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT *
    FROM songs
    WHERE tj_number = ?
  `
    )
    .get(tjNumber);
}

export function setSongLlm(tjNumber: string, titleKoLlm: string) {
  const db = getDb();
  return db
    .prepare(
      `
    UPDATE songs
    SET title_ko_llm = ?, updated_at = CURRENT_TIMESTAMP
    WHERE tj_number = ?
  `
    )
    .run(titleKoLlm, tjNumber);
}

export function getLlmUsage(day?: string): number {
  ensureLlmUsageTable();
  const db = getDb();
  const targetDay = day || formatToday();
  const row = db
    .prepare(
      `
    SELECT count FROM llm_usage WHERE day = ?
  `
    )
    .get(targetDay) as { count: number } | undefined;
  return row?.count ?? 0;
}

export function incrementLlmUsage(day?: string) {
  ensureLlmUsageTable();
  const db = getDb();
  const targetDay = day || formatToday();
  db.prepare(
    `
    INSERT INTO llm_usage(day, count)
    VALUES (?, 1)
    ON CONFLICT(day) DO UPDATE SET count = llm_usage.count + 1
  `
  ).run(targetDay);
}

export function confirmSong(id: number, titleKoMain: string) {
  const db = getDb();
  return db
    .prepare(
      `
    UPDATE songs
    SET title_ko_main = ?, is_confirmed = 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `
    )
    .run(titleKoMain, id);
}
