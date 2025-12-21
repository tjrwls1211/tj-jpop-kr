const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'songs.db');
const schemaPath = path.join(__dirname, '..', 'data', 'schema.sql');

// DB 파일이 이미 있으면 삭제
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('기존 DB 삭제됨');
}

// 새 DB 생성
const db = new Database(dbPath);

// 스키마 실행
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);
console.log('스키마 생성 완료');

db.close();
console.log('DB 초기화 완료! (빈 DB)');
console.log('크롤링 스크립트로 데이터를 채워주세요: python scripts/crawl_chart_api.py');
