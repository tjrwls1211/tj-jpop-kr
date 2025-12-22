import { searchSongs } from '@/lib/db';
import { SongCard } from '@/components/SongCard';
import { SongWithRank } from '@/lib/types';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q || '';
  const songs = query ? ((await searchSongs(query)) as SongWithRank[]) : [];

  return (
    <div>
      <div className="header">
        <h1>검색</h1>
      </div>

      <form method="GET" style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="어떤 곡을 찾으시나요?"
            className="search-input"
            autoFocus
          />
          <button type="submit" className="btn">
            검색
          </button>
        </div>
      </form>

      {query && (
        <>
          <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>
            '{query}' 검색 결과
          </h2>
          {songs.length === 0 ? (
            <p style={{ color: '#b3b3b3' }}>검색 결과가 없습니다.</p>
          ) : (
            songs.map((song) => <SongCard key={song.id} song={song} />)
          )}
        </>
      )}
    </div>
  );
}
