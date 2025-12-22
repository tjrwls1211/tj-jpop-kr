import { getConfirmedSongsByRange } from '@/lib/db';
import { SongCard } from '@/components/SongCard';
import { SongWithRank } from '@/lib/types';
import Link from 'next/link';

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
        <div className="header">
          <h1>잘못된 범위입니다</h1>
        </div>
      </div>
    );
  }

  const songs = (await getConfirmedSongsByRange(
    rangeData.start,
    rangeData.end
  )) as SongWithRank[];

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

      <h2 style={{ marginBottom: '15px' }}>
        TOP {rangeData.start}-{rangeData.end}
      </h2>

      {songs.length === 0 ? (
        <p>곡이 없습니다.</p>
      ) : (
        songs.map((song) => <SongCard key={song.id} song={song} />)
      )}
    </div>
  );
}
