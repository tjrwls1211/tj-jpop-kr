import { getPendingSongs, getLlmUsage } from '@/lib/db';
import { SongWithRank } from '@/lib/types';
import { confirmSongAction, requestLlmSuggestion } from './actions';

export default async function AdminPendingPage() {
  const songs = (await getPendingSongs()) as SongWithRank[];
  const llmLimit = Number(process.env.LLM_DAILY_LIMIT || '20');
  const llmUsed = await getLlmUsage();

  return (
    <div>
      <h2 style={{ marginBottom: '15px' }}>미확정 곡({songs.length})</h2>
      <div className="translation-box" style={{ marginBottom: '15px' }}>
        <strong>LLM 일일 한도:</strong> {llmUsed} / {llmLimit}
      </div>

      {songs.length === 0 ? (
        <p>모든 곡이 확정되었습니다.</p>
      ) : (
        songs.map((song) => (
          <div key={song.id} className="admin-card">
            <div style={{ marginBottom: '25px' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0070f3' }}>
                #{song.rank || '순위 없음'}
              </div>
              <div style={{ fontSize: '18px', marginTop: '5px', fontWeight: 'bold' }}>
                {song.title_ja}
              </div>
              <div style={{ color: '#666', marginTop: '5px' }}>
                {song.artist_ja} {song.artist_ko && `(${song.artist_ko})`}
              </div>
              <div style={{ color: '#999', fontSize: '14px', marginTop: '3px' }}>
                TJ {song.tj_number}
              </div>
            </div>

            <div className="translation-box">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <strong>번역기:</strong> {song.title_ko_auto || '-'}
                </div>
                <div>
                  <strong>LLM 초안:</strong> {song.title_ko_llm || '-'}
                </div>
              </div>
              <form action={requestLlmSuggestion}>
                <input type="hidden" name="tj_number" value={song.tj_number} />
                <button type="submit" className="btn btn-secondary">
                  LLM 제안 받기
                </button>
              </form>
            </div>

            <form action={confirmSongAction}>
              <input type="hidden" name="id" value={song.id} />
              <div className="form-group">
                <label className="label">최종 한국어 제목</label>
                <input
                  type="text"
                  name="title_ko_main"
                  className="input"
                  defaultValue={song.title_ko_llm || song.title_ko_auto || ''}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn">
                  확정
                </button>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                    song.title_ja + ' ' + song.artist_ja + '한국어 가사'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ textDecoration: 'none', display: 'inline-block' }}
                >
                  YouTube 검색
                </a>
              </div>
            </form>
          </div>
        ))
      )}
    </div>
  );
}
