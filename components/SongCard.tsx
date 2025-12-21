import { SongWithRank } from '@/lib/types';

export function SongCard({ song }: { song: SongWithRank }) {
  return (
    <div className="song-card">
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <span className="song-rank">#{song.rank}</span>
        <div style={{ flex: 1 }}>
          <div className="song-title">{song.title_ko_main || song.title_ja}</div>
          <div className="song-info">{song.title_ja}</div>
          <div className="song-info">
            {song.artist_ko && `${song.artist_ko} / `}
            {song.artist_ja}
          </div>
          <div className="song-info">TJ {song.tj_number}</div>
        </div>
      </div>
    </div>
  );
}
