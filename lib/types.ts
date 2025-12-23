// 곡 정보 (songs 테이블)
export interface Song {
  id: number;
  tj_number: string;
  title_ja: string;
  title_ko_main: string | null;
  title_ko_auto: string | null;
  title_ko_llm: string | null;
  artist_ja: string;
  artist_ko: string | null;
  is_confirmed: number;
  created_at: string;
  updated_at: string;
}

// 일간 차트 (daily_charts 테이블)
export interface DailyChart {
  id: number;
  date: string;
  tj_number: string;
  rank: number;
  created_at: string;
}

// 곡 + 순위 (JOIN 결과)
export interface SongWithRank extends Song {
  rank: number;
  date: string;
}
