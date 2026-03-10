# TJ J-POP 차트 TOP 100

TJ 노래방 J-POP 인기 차트를 한글 제목으로 쉽게 찾을 수 있는 웹 서비스
<img width="1898" height="832" alt="image" src="https://github.com/user-attachments/assets/12747767-295b-4058-a6b9-3d74682660dc" />

- 공개 차트는 `/chart` 단일 페이지에서 TOP 100을 보여줍니다.
- 검색은 한국어/일본어 제목과 아티스트명을 기준으로 동작합니다.
- 차트 외의 곡들 검색 **(추가 예정 - 일부만 가능)**
---

## 주요 기능

- TOP 100 차트 조회
- 곡 검색
- 관리자 번역 확정
- Gemini 기반 제목 초안 제안
- 차트 페이지 ISR 캐싱

---

## 프로젝트 구조

```text
tj-jpop-kr/
├── app/
│   ├── admin/
│   │   ├── login/        # 관리자 로그인
│   │   └── pending/      # 미확정 곡 관리 + LLM 제안
│   ├── chart/            # 공개 TOP 100 차트 페이지
│   ├── search/           # 검색 페이지
│   ├── layout.tsx
│   └── page.tsx          # / -> /chart 리다이렉트
├── components/           # UI 컴포넌트
├── data/
│   ├── schema.sql
│   └── songs.db          # 로컬 SQLite DB
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   └── types.ts
├── scripts/
│   ├── crawl_chart_api.py
│   └── init-db.js
├── docker-compose.yml
└── README.md
```

---

## 기술 스택

- Next.js 15 App Router
- React 19
- TypeScript
- SQLite (`better-sqlite3`)
- Turso (`@libsql/client`)
- Google Gemini API
- Python 크롤링 스크립트

---

## 라우트

### 공개 페이지

- `/` -> `/chart` 리다이렉트
- `/chart` -> TOP 100 차트
- `/search` -> 곡 검색

### 관리자 페이지

- `/admin/login` -> 관리자 로그인
- `/admin/pending` -> 번역 확정 및 LLM 제안

---

## 차트 캐싱

공개 차트 페이지는 ISR로 캐싱됩니다.

- 설정 위치: [app/chart/page.tsx](/c:/Users/tjrwls/IdeaProjects/tj-jpop-kr/app/chart/page.tsx)
- 현재 설정: `export const revalidate = 3600`
- 의미: `/chart` 페이지를 최대 1시간 단위로 재생성

관리자가 번역을 확정하거나 LLM 제안을 저장하면 `revalidatePath('/chart')`가 호출되어 차트 캐시가 즉시 무효화됩니다.

---

## 데이터 구조

### `songs`

- `id`
- `tj_number`
- `title_ja`
- `title_ko_main`
- `title_ko_auto`
- `title_ko_llm`
- `artist_ja`
- `artist_ko`
- `is_confirmed`

### `daily_charts`

- `id`
- `date`
- `tj_number`
- `rank`

---

## 실행 방법

### 1. Next.js 앱 실행

```bash
npm install
npm run db:init
npm run dev
```

### 2. Python 크롤러 실행

#### Docker 사용

```bash
docker-compose build
docker-compose up
```

#### 직접 실행

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python scripts/crawl_chart_api.py
```

Turso를 쓰는 경우에는 환경 변수 설정 후 해당 스크립트를 사용하면 됩니다.

---

## 환경 변수

`.env.local` 예시:

```env
ADMIN_PASSWORD=admin123
GEMINI_API_KEY=your_gemini_api_key_here
TJ_CHART_API_URL=https://www.tjmedia.com/legacy/api/topAndHot100
SESSION_SECRET=your_session_secret_here
SESSION_COOKIE_NAME=admin_session
GEMINI_MODEL=gemini-2.5-flash
LLM_DAILY_LIMIT=20

# Optional
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token
```

로컬 SQLite를 사용할 때 DB 파일은 기본적으로 `data/songs.db`를 사용합니다.

---

## 운영 흐름

### 1. 차트 수집

- TJ Media API에서 TOP 100 데이터를 수집
- 신규 곡은 `songs`에 저장
- 일별 순위는 `daily_charts`에 저장

### 2. 번역 확정

- 관리자 페이지에서 미확정 곡 확인
- 자동 번역 또는 LLM 제안 참고
- 최종 제목을 `title_ko_main`으로 확정
- 확정 후 공개 차트와 검색 페이지 캐시 무효화

---

## 배포 메모

Vercel 환경에서는 로컬 파일 DB 지속성이 제한되므로, 배포 환경에서는 Turso 사용을 권장합니다.

---

## 라이선스

MIT
