# 더부동산 매물관리시스템

Supabase와 Vercel을 사용한 부동산 매물 관리 웹 애플리케이션

## 설정 방법

### 1. Supabase 설정

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 `supabase_setup.sql` 파일의 쿼리 실행
3. Project Settings > API에서 다음 정보 확인:
   - Project URL
   - anon/public key

### 2. 코드 설정

1. `supabase-config.js` 파일 수정:
```javascript
const SUPABASE_URL = 'your-project-url.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### 3. Vercel 배포

1. GitHub 저장소에 코드 푸시
2. [Vercel](https://vercel.com)에서 새 프로젝트 생성
3. GitHub 저장소 연결
4. 환경 변수 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy 클릭

## 파일 구조

```
/
├── index.html          # 매물 목록 페이지
├── form.html           # 매물 등록/수정 페이지
├── styles.css          # 공통 스타일
├── form-styles.css     # 폼 전용 스타일
├── script-supabase.js  # 목록 페이지 Supabase 연동
├── form-script-supabase.js # 폼 페이지 Supabase 연동
├── supabase-config.js  # Supabase 설정
├── supabase_setup.sql  # 데이터베이스 테이블 생성 쿼리
└── vercel.json         # Vercel 배포 설정
```

## 주요 기능

- 매물 등록/수정/조회
- 실시간 데이터 동기화
- 필터링 및 검색
- 반응형 디자인 (데스크톱/모바일)
- 매물 상태 관리

## 기술 스택

- Frontend: HTML, CSS, JavaScript
- Database: Supabase (PostgreSQL)
- Hosting: Vercel
- Real-time: Supabase Realtime