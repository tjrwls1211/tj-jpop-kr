import os
import time
from datetime import date, timedelta
import sys
import re
from pathlib import Path
import requests
from dotenv import load_dotenv
from googletrans import Translator
from libsql_client import create_client_sync

load_dotenv(".env.local")

TURSO_URL = os.getenv("TURSO_DATABASE_URL")
TURSO_TOKEN = os.getenv("TURSO_AUTH_TOKEN")
TJ_CHART_API_URL = os.getenv(
    "TJ_CHART_API_URL", "https://www.tjmedia.com/legacy/api/topAndHot100"
)
ARTIST_ALIAS_PATH = Path(
    os.getenv("ARTIST_ALIAS_PATH", "data/artist_aliases.tsv")
)
TRANS_SLEEP_SECONDS = float(os.getenv("TRANS_SLEEP_SECONDS", "0.5"))

translator = Translator()
KOREAN_CHAR_RE = re.compile(r"[가-힣]")
ARTIST_ALIAS_MAP = {}


def safe_print(msg: str):
    """Print helper tolerant to console encoding issues."""
    try:
        print(msg)
    except UnicodeEncodeError:
        sys.stdout.buffer.write((msg + "\n").encode("utf-8", "backslashreplace"))
        sys.stdout.buffer.flush()


def load_artist_aliases():
    mapping = {}
    if not ARTIST_ALIAS_PATH.exists():
        return mapping
    with ARTIST_ALIAS_PATH.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "\t" not in line:
                continue
            ja, ko = line.split("\t", 1)
            mapping[ja.strip()] = ko.strip()
    return mapping


ARTIST_ALIAS_MAP = load_artist_aliases()


def crawl_tj_jpop_chart():
    songs = []

    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8",
            "Origin": "https://www.tjmedia.com",
            "Referer": "https://www.tjmedia.com/chart/top100",
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        }
    )

    today = date.today()
    yesterday = today - timedelta(days=1)
    data = {
        "chartType": "TOP",
        "strType": "3",  
        "searchStartDate": yesterday.strftime("%Y-%m-%d"),
        "searchEndDate": today.strftime("%Y-%m-%d"),
    }

    try:
        print(f"TJ API 요청: {TJ_CHART_API_URL}")
        print(f"파라미터: {data}\n")

        response = session.post(TJ_CHART_API_URL, data=data, timeout=15)
        response.raise_for_status()

        try:
            result = response.json()
        except ValueError:
            print("JSON 파싱 실패, 원문:", response.text[:1000])
            return []

        if result.get("resultCode") == "99":
            items = result.get("resultData", {}).get("items", [])
            print(f"API 응답 정상: {len(items)}곡 발견")
            for item in items:
                songs.append(
                    {
                        "rank": int(item["rank"]),
                        "tj_number": item["pro"],
                        "title_ja": item["indexTitle"],
                        "artist_ja": item["indexSong"],
                    }
                )
            return songs

        print(
            f"API 오류: resultCode = {result.get('resultCode')}, body: {str(result)[:500]}"
        )
        return []

    except Exception as e:
        print(f"API 요청 실패: {e}")
        import traceback

        traceback.print_exc()
        return []


def translate_to_korean(text):
    if all(ord(ch) < 128 for ch in text):
        return text
    try:
        result = translator.translate(text, src="ja", dest="ko")
        return result.text
    except Exception as e:
        print(f"구글 번역 실패: {e}")
        return None


def translate_artist(artist_ja):
    if artist_ja in ARTIST_ALIAS_MAP:
        return ARTIST_ALIAS_MAP[artist_ja]

    if "(" in artist_ja:
        prefix = artist_ja.split("(", 1)[0].strip()
        if KOREAN_CHAR_RE.search(prefix):
            return prefix

    if any("A" <= ch <= "z" or ch.isdigit() for ch in artist_ja):
        return artist_ja

    try:
        result = translator.translate(artist_ja, src="ja", dest="ko")
        return result.text
    except Exception as e:
        print(f"가수명 번역 실패: {e}")
        return None


def update_database(songs):
    if not TURSO_URL or not TURSO_TOKEN:
        print("Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set")
        return

    print(f"Using Turso database: {TURSO_URL}")
    client = create_client_sync(url=TURSO_URL, auth_token=TURSO_TOKEN)

    today = date.today().isoformat()
    client.execute("DELETE FROM weekly_charts WHERE week = ?", [today])
    print(f"기존 {today} 차트 레코드 삭제 완료\n")

    new_songs_count = 0
    updated_songs_count = 0

    for song in songs:
        result = client.execute("SELECT id FROM songs WHERE tj_number = ?", [song["tj_number"]])
        existing = result.rows[0] if result.rows else None

        if existing:
            client.execute(
                """
                INSERT INTO weekly_charts (week, tj_number, rank)
                VALUES (?, ?, ?)
            """,
                [today, song["tj_number"], song["rank"]],
            )
            updated_songs_count += 1
            if updated_songs_count <= 10:
                safe_print(f"순위 추가: #{song['rank']} {song['title_ja']}")
            continue

        safe_print(f"\n[신규 곡 #{song['rank']}] {song['title_ja']} - {song['artist_ja']}")

        title_ko_auto = translate_to_korean(song["title_ja"])
        artist_ko = translate_artist(song["artist_ja"])
        safe_print(f"  구글 번역: {title_ko_auto}")
        time.sleep(TRANS_SLEEP_SECONDS)

        client.execute(
            """
            INSERT INTO songs
            (tj_number, title_ja, title_ko_auto, title_ko_llm,
             artist_ja, artist_ko, is_confirmed)
            VALUES (?, ?, ?, ?, ?, ?, 0)
        """,
            [
                song["tj_number"],
                song["title_ja"],
                title_ko_auto,
                None,
                song["artist_ja"],
                artist_ko,
            ],
        )

        client.execute(
            """
            INSERT INTO weekly_charts (week, tj_number, rank)
            VALUES (?, ?, ?)
        """,
            [today, song["tj_number"], song["rank"]],
        )

        new_songs_count += 1

    result = client.execute("SELECT COUNT(*) FROM songs WHERE is_confirmed = 0")
    pending_count = result.rows[0][0] if result.rows else 0
    result = client.execute("SELECT COUNT(*) FROM songs")
    total_count = result.rows[0][0] if result.rows else 0

    print(f"\n{'='*50}")
    print("DB 업데이트 완료")
    print(f"{'='*50}")
    print(f"이번 주차: {today}")
    print(f"신규 곡 {new_songs_count}곡")
    print(f"기존 곡 순위 업데이트: {updated_songs_count}곡")
    print(f"전체 곡 {total_count}곡")
    print(f"미확정 곡 {pending_count}곡")
    print(f"{'='*50}\n")

    client.close()


def main():
    print("=" * 50)
    print("TJ J-POP 차트 크롤링 (Turso)")
    print("=" * 50 + "\n")

    songs = crawl_tj_jpop_chart()

    if not songs:
        print("크롤링 실패 - 종료")
        return

    print("\n번역 및 DB 업데이트 시작..\n")
    update_database(songs)

    print("작업 완료!")


if __name__ == "__main__":
    main()
