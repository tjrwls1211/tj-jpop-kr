import { SongWithRank } from '@/lib/types';

export function SongCard({ song }: { song: SongWithRank }) {
  // Logic to display artist nicely
  const displayArtist = () => {
    if (song.artist_ko && song.artist_ja && song.artist_ko !== song.artist_ja) {
      return `${song.artist_ko} • ${song.artist_ja}`;
    }
    return song.artist_ko || song.artist_ja;
  };

  return (
    <div className="song-card">
      <div className="song-rank">{song.rank}</div>
      <div className="song-details">
        <div className="song-title">
          {song.title_ko_main || song.title_ja}
          {/* Show original title if different */}
          {song.title_ko_main && song.title_ko_main !== song.title_ja && (
            <span style={{ color: '#b3b3b3', fontSize: '0.85em', marginLeft: '6px', fontWeight: 400 }}>
              {song.title_ja}
            </span>
          )}
        </div>
        <div className="song-info">
          {displayArtist()}
        </div>
      </div>
      <div className="song-tj-num" style={{ textAlign: 'right', fontSize: '14px', color: '#b3b3b3' }}>
        <span style={{ fontSize: '12px', marginRight: '4px', opacity: 0.7 }}>TJ</span>
        {song.tj_number}
      </div>
    </div>
  );
}
