import { searchSongs } from '@/lib/db';
import { SongCard } from '@/components/SongCard';
import { SongWithRank } from '@/lib/types';
import Link from 'next/link';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q || '';
  const songs = query ? ((await searchSongs(query)) as SongWithRank[]) : [];

  return (
    <div className="container">
      <div className="header">
        <h1>TJ J-POP 차트 TOP 100</h1>
        <div className="nav">
          <Link href="/chart/1-50">TOP 1-50</Link>
          <Link href="/chart/51-100">TOP 51-100</Link>
          <Link href="/search">검색</Link>
        </div>
      </div>

      <form method="GET" className="search-form">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="곡명, 가수명으로 검색..."
          className="search-input"
        />
        <button type="submit" className="btn" style={{ marginLeft: '10px' }}>
          검색
        </button>
      </form>

      {query && (
        <>
          <h2 style={{ marginBottom: '15px' }}>
            검색 결과: {songs.length}곡
          </h2>
          {songs.length === 0 ? (
            <p>검색 결과가 없습니다.</p>
          ) : (
            songs.map((song) => <SongCard key={song.id} song={song} />)
          )}
        </>
      )}
    </div>
  );
}
