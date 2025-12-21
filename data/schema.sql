-- 곡 정보 테이블 (불변 데이터)
CREATE TABLE IF NOT EXISTS songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tj_number TEXT NOT NULL UNIQUE,
  title_ja TEXT NOT NULL,
  title_ko_main TEXT,
  title_ko_auto TEXT,
  title_ko_llm TEXT,
  artist_ja TEXT NOT NULL,
  artist_ko TEXT,
  is_confirmed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 주간 차트 테이블 (매주 새로 INSERT)
CREATE TABLE IF NOT EXISTS weekly_charts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week DATE NOT NULL,
  tj_number TEXT NOT NULL,
  rank INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tj_number) REFERENCES songs(tj_number)
);

CREATE INDEX IF NOT EXISTS idx_is_confirmed ON songs(is_confirmed);
CREATE INDEX IF NOT EXISTS idx_tj_number ON songs(tj_number);
CREATE INDEX IF NOT EXISTS idx_week ON weekly_charts(week);
CREATE INDEX IF NOT EXISTS idx_week_rank ON weekly_charts(week, rank);
