# 더부동산 매물관리시스템

## 📋 개요
더부동산중개법인의 매물 관리를 위한 실시간 연동 웹 시스템입니다.

## ✨ 주요 기능

### 🏠 매물 관리
- **실시간 매물 등록/수정/삭제**
- **자동 매물번호 생성** (YYYYMMDD001 형식)
- **완전한 감사추적** (모든 변경사항 기록)
- **소프트 삭제** (데이터 보존)

### 👥 사용자 관리
- **관리자/일반 사용자 권한 분리**
- **세션 기반 인증**
- **사용자별 UUID 관리**

### 🔄 실시간 기능
- **다중 사용자 실시간 동기화**
- **즉시 데이터 업데이트** (새로고침 불필요)
- **실시간 알림 시스템**

### 📊 데이터 보안
- **Row Level Security (RLS)**
- **완전한 변경이력 추적**
- **물리적 데이터 삭제 방지**

### 🔗 외부 연동
- **Slack 웹훅 연동**
- **매물 정보 원클릭 공유**
- **실시간 슬랙 알림 시스템**

### 🔔 알림 시스템
- **새 매물 등록 자동 알림**
- **매물 상태 변경 알림**
- **슬랙 전송 알림**
- **사용자별 알림 설정 관리**

## 🛠️ 기술 스택
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Supabase (PostgreSQL + Realtime)
- **배포**: GitHub Pages
- **외부 API**: Slack Webhooks

## 🚀 배포 URL
- **Live Demo**: [https://yourusername.github.io/realty-system/](https://yourusername.github.io/realty-system/)

## 📱 반응형 디자인
- **데스크톱**: 사이드패널 상세뷰
- **태블릿**: 2열 그리드 + 모달
- **모바일**: 1열 그리드 + 최적화된 UI

## 🔧 로컬 실행 방법
1. 파일 다운로드
2. `index.html` 브라우저에서 열기
3. Supabase 연결 자동 확인

## 📁 프로젝트 구조
```
/
├── index.html              # 메인 페이지
├── form.html              # 매물 등록/수정
├── admin-login.html       # 관리자 로그인
├── styles.css             # 메인 스타일
├── form-styles.css        # 폼 스타일
├── supabase-config.js     # DB 연결 설정
├── script.js              # 메인 로직
├── form-script-supabase.js # 폼 로직
├── slack-config.js        # Slack 연동 및 알림 시스템
├── slack-integration.js   # Slack 통합 기능
├── notification-settings.html # 알림 설정 페이지
└── supabase-schema.sql    # DB 스키마
```

## 🔐 보안 기능
- **RLS (Row Level Security)**
- **사용자별 권한 제어**
- **API 키 보안 관리**
- **CORS 정책 적용**

## 📈 성능 최적화
- **인덱스 최적화**
- **실시간 구독 필터링**
- **클라이언트 캐싱**
- **반응형 이미지**

## 🎯 향후 계획
- [x] 실시간 슬랙 알림 시스템 ✅
- [ ] 파일 업로드 기능
- [ ] 매물 사진 관리
- [ ] 고급 검색 필터
- [ ] 데이터 내보내기
- [ ] 모바일 앱 연동

---

© 2025 더부동산중개법인. All rights reserved.