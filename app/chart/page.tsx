import { getConfirmedSongsByRange } from '@/lib/db';
import { SongCard } from '@/components/SongCard';
import { SongWithRank } from '@/lib/types';

export const revalidate = 3600;

export default async function ChartPage() {
  const songs = (await getConfirmedSongsByRange(1, 100)) as SongWithRank[];

  return (
    <div>
      <div className="header">
        <h1>TOP 100</h1>
        <p style={{ color: '#b3b3b3', marginTop: '-10px', marginBottom: '30px' }}>
          TJ J-POP 차트 순위
        </p>
      </div>

      <div style={{ paddingBottom: '50px' }}>
        {songs.length === 0 ? (
          <p>곡이 없습니다.</p>
        ) : (
          songs.map((song) => <SongCard key={song.id} song={song} />)
        )}
      </div>
    </div>
  );
}
