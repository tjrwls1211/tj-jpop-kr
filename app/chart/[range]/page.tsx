import { getConfirmedSongsByRange } from '@/lib/db';
import { SongCard } from '@/components/SongCard';
import { SongWithRank } from '@/lib/types';

type RangeType = '1-50' | '51-100';

const ranges: { [key in RangeType]: { start: number; end: number } } = {
  '1-50': { start: 1, end: 50 },
  '51-100': { start: 51, end: 100 },
};

export default async function ChartPage({
  params,
}: {
  params: Promise<{ range: string }>;
}) {
  const { range } = await params;
  const rangeData = ranges[range as RangeType];

  if (!rangeData) {
    return (
      <div className="container">
        <h1>잘못된 범위입니다</h1>
      </div>
    );
  }

  const songs = (await getConfirmedSongsByRange(
    rangeData.start,
    rangeData.end
  )) as SongWithRank[];

  return (
    <div>
      <div className="header">
        <h1>TOP {rangeData.start}-{rangeData.end}</h1>
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
