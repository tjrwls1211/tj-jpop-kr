# TJ J-POP 차트 TOP 100

TJ 노래방 J-POP 인기 차트를 한글 제목으로 쉽게 찾을 수 있는 웹 서비스

---

## 프로젝트 구조

```
tj-jpop-kr/
├── app/                    # Next.js 페이지
│   ├── chart/[range]/     # 차트 페이지 (1-50, 51-100, 101-150, 151-200)
│   ├── search/            # 검색 페이지
│   └── admin/             # 관리자 페이지
│       ├── login/         # 로그인
│       └── pending/       # 미확정 곡 관리 + LLM 제안
├── lib/                   # 유틸리티
│   ├── db.ts             # DB 쿼리 함수
│   └── auth.ts           # 인증 함수
├── components/            # React 컴포넌트
├── data/                  # 데이터베이스
│   ├── schema.sql        # DB 스키마
│   └── songs.db          # SQLite DB
└── scripts/               # 스크립트
    ├── crawl_chart_api.py # TJ API 크롤링 (Python)
    └── init-db.js        # DB 초기화 (Node.js)
```

---

## 기술 스택

**Frontend & Backend:**
- Next.js 15 (App Router)
- TypeScript
- React 19
- SQLite (better-sqlite3)

**Data Collection:**
- Python 3
- TJ Media API (공식 차트 API)
- googletrans (무료 번역)
- Google Gemini API (gemini-2.5-flash, 온디맨드 LLM 제안)

---

## 데이터베이스 구조

### songs 테이블 (곡 정보)
```sql
- id                   (PK)
- tj_number            (TJ 번호, UNIQUE)
- title_ja             (일본어 제목)
- title_ko_main        (최종 한글 제목 - 관리자 확정)
- title_ko_auto        (구글 번역 결과)
- title_ko_llm         (LLM 번역 제안)
- artist_ja            (일본어 가수명)
- artist_ko            (한글 가수명)
- is_confirmed         (확정 여부)
```

### weekly_charts 테이블 (주간 순위)
```sql
- id                   (PK)
- week                 (주차, DATE)
- tj_number            (FK -> songs.tj_number)
- rank                 (순위)
```

**장점:**
- songs는 한 번만 INSERT (불변)
- 순위는 weekly_charts에 매주 INSERT
- 과거 순위 히스토리 추적 가능

---

## 설치 및 실행

### 1. Next.js 프로젝트 설정

```bash
# 패키지 설치
npm install

# DB 초기화
npm run db:init

# 개발 서버 실행
npm run dev
```

### 2. Python 크롤링 설정

```bash
# Python 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 패키지 설치
pip install -r requirements.txt

# 환경변수 설정
# .env.local 파일에 필수 환경변수 입력

# 크롤링 실행 (TJ API → DB 저장)
python scripts/crawl_chart_api.py
```

---

## 환경변수 (.env.local)

```env
# 관리자 비밀번호
ADMIN_PASSWORD=admin123

# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# 데이터베이스 경로 (로컬 개발용)
DB_PATH=data/songs.db

# TJ 노래방 차트 API URL
TJ_CHART_API_URL=https://www.tjmedia.com/legacy/api/topAndHot100

# 세션 인증 (보안 강화 필수!)
# 생성: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=your_session_secret_here
SESSION_COOKIE_NAME=admin_session

# LLM 설정
GEMINI_MODEL=gemini-2.5-flash
LLM_DAILY_LIMIT=20

# Turso Database (배포용 - 선택사항)
# TURSO_DATABASE_URL=libsql://your-database.turso.io
# TURSO_AUTH_TOKEN=your_turso_auth_token
```

---

## 사용 방법

### 공개 페이지
- **메인**: http://localhost:3000
- **차트**: /chart/1-50, /chart/51-100, etc.
- **검색**: /search

### 관리자 페이지
1. http://localhost:3000/admin/login 접속
2. 비밀번호 입력 (기본: admin123)
3. 미확정 곡 확인 및 한글 제목 확정

---

## 크롤링 플로우

### 1. 주간 차트 크롤링 (자동화 권장)

```bash
python scripts/crawl_chart_api.py
```

**처리 과정:**
- TJ Media API에서 J-POP TOP 100 데이터 수집
- **신규 곡**: 구글 번역으로 `title_ko_auto` 생성 → songs 테이블 INSERT (is_confirmed=0)
- **기존 곡**: weekly_charts 테이블에 순위만 INSERT
- LLM 번역은 **실행하지 않음** (비용 절감)

### 2. 관리자 번역 확정 (수동)

1. `/admin/pending` 접속
2. 미확정 곡 목록 확인
3. **LLM 제안 받기** 버튼 클릭 (필요시만)
   - Gemini API로 한국 대중이 실제 사용하는 제목 제안
   - 일일 한도: 20회
4. 구글 번역 / LLM 제안 중 선택하거나 직접 입력
5. **확정** 클릭 → `is_confirmed=1`, 공개 페이지 노출

---

## 배포 (Vercel + Turso)

⚠️ **주의:** Vercel은 서버리스 환경으로 파일시스템 쓰기가 제한됩니다.

### 권장 방식: GitHub Actions + Turso DB

1. **Turso DB 설정**: 클라우드 SQLite DB 생성 (무료 티어)
2. **크롤링 자동화**: GitHub Actions에서 매주 `crawl_chart_api.py` 실행
3. **관리자 확정**: Vercel 배포된 `/admin/pending`에서 번역 확정
4. **자동 배포**: Git push → Vercel 자동 재배포

---

## 라이선스

MIT
