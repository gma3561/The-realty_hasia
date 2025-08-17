# 더부동산 매물관리시스템 PRD (Supabase + Vercel)

## 1. 개요

### 1.1 프로젝트 목표
Supabase를 데이터베이스로 사용하고 Vercel로 배포하는 간단한 매물 입력/조회 웹 애플리케이션

### 1.2 기술 스택
- **데이터베이스**: Supabase (PostgreSQL)
- **호스팅**: Vercel
- **프론트엔드**: HTML/CSS/JavaScript

## 2. 핵심 기능 요구사항

### 2.1 데이터 입력
- 매물 정보 입력 폼
- Supabase 데이터베이스에 데이터 저장
- 입력 완료 후 확인 메시지

### 2.2 데이터 조회
- Supabase에서 데이터 불러오기
- 테이블 형태로 매물 목록 표시
- 실시간 데이터 동기화

## 3. Supabase 데이터베이스 설계

### 3.1 테이블 구조: `properties`

```sql
CREATE TABLE properties (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- 기본 정보
  register_date DATE,
  shared BOOLEAN DEFAULT false,
  manager VARCHAR(100),
  status VARCHAR(50),
  re_register_reason TEXT,
  
  -- 매물 정보
  property_type VARCHAR(50),
  property_name VARCHAR(200),
  dong VARCHAR(50),
  ho VARCHAR(50),
  address TEXT,
  
  -- 거래 정보
  trade_type VARCHAR(50),
  price VARCHAR(100),
  
  -- 면적 정보
  supply_area_sqm VARCHAR(100),
  supply_area_pyeong VARCHAR(100),
  
  -- 층/구조 정보
  floor_info VARCHAR(50),
  rooms VARCHAR(50),
  direction VARCHAR(50),
  
  -- 관리 정보
  management_fee VARCHAR(100),
  parking VARCHAR(100),
  move_in_date DATE,
  approval_date DATE,
  
  -- 추가 정보
  special_notes TEXT,
  manager_memo TEXT,
  
  -- 거래 완료 정보
  completion_date DATE,
  resident VARCHAR(50),
  lease_type VARCHAR(50),
  lease_amount VARCHAR(100),
  contract_period VARCHAR(100)
);
```

## 4. 구현 요구사항

### 4.1 매물 등록 페이지 (`form.html`)

#### 필수 입력 필드
- 등록일
- 담당자
- 매물종류
- 매물명
- 거래유형
- 금액

#### 선택 입력 필드
- 매물상태
- 재등록사유
- 동/호
- 소재지
- 면적 정보
- 층/구조 정보
- 특이사항
- 담당자 메모

#### 기능
- 입력 유효성 검사
- Supabase API로 데이터 전송
- 저장 성공/실패 알림
- 저장 후 목록 페이지로 이동

### 4.2 매물 목록 페이지 (`index.html`)

#### 표시 항목
- 등록일
- 담당자
- 매물상태
- 매물종류
- 거래유형
- 금액
- 매물명
- 층
- 호
- 면적

#### 기능
- Supabase에서 데이터 조회
- 테이블 형태로 표시
- 페이지네이션
- 간단한 정렬 (등록일 기준)
- 매물 등록 버튼 (form.html로 이동)

## 5. Supabase 설정

### 5.1 프로젝트 설정
```javascript
// supabase-config.js
const SUPABASE_URL = 'your-project-url.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key'

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

### 5.2 데이터 작업

#### 데이터 입력
```javascript
async function insertProperty(propertyData) {
  const { data, error } = await supabase
    .from('properties')
    .insert([propertyData])
  
  if (error) {
    console.error('Error inserting:', error)
    return false
  }
  return true
}
```

#### 데이터 조회
```javascript
async function getProperties() {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching:', error)
    return []
  }
  return data
}
```

## 6. Vercel 배포 설정

### 6.1 프로젝트 구조
```
/
├── index.html          # 매물 목록 페이지
├── form.html           # 매물 등록 페이지
├── styles.css          # 공통 스타일
├── form-styles.css     # 폼 전용 스타일
├── script.js           # 목록 페이지 스크립트
├── form-script.js      # 폼 페이지 스크립트
├── supabase-config.js  # Supabase 설정
└── vercel.json         # Vercel 설정
```

### 6.2 vercel.json 설정
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

### 6.3 환경변수
Vercel 대시보드에서 설정:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 7. 보안 고려사항

### 7.1 Row Level Security (RLS)
```sql
-- 모든 사용자가 읽기 가능
CREATE POLICY "Enable read access for all users" ON properties
  FOR SELECT USING (true);

-- 모든 사용자가 쓰기 가능 (프로덕션에서는 인증 추가)
CREATE POLICY "Enable insert for all users" ON properties
  FOR INSERT WITH CHECK (true);
```

### 7.2 입력 검증
- 클라이언트 측 유효성 검사
- SQL 인젝션 방지 (Supabase가 자동 처리)

## 8. 배포 프로세스

### 8.1 초기 설정
1. Supabase 프로젝트 생성
2. 테이블 생성 및 RLS 설정
3. API 키 획득

### 8.2 개발
1. 로컬에서 개발 및 테스트
2. Supabase 연동 확인
3. Git 저장소에 푸시

### 8.3 Vercel 배포
1. Vercel에 GitHub 저장소 연결
2. 환경변수 설정
3. 자동 배포 설정
4. 도메인 연결 (선택사항)

## 9. 성공 지표

- Supabase에 데이터 저장 성공
- Vercel 배포 완료
- 웹에서 매물 등록/조회 가능
- 데이터 영속성 보장
- 실시간 데이터 동기화

## 10. 향후 개선사항

- 사용자 인증 추가
- 고급 검색/필터링
- 매물 수정/삭제 기능
- 이미지 업로드
- 모바일 앱 개발