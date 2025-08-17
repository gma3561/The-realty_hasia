# 🔐 더부동산 보안 설정 가이드

## ⚠️ 중요 공지
**현재 시스템의 보안 점수는 25/100 (F등급)으로 즉시 개선이 필요합니다.**

## 🚀 빠른 시작 (필수)

### 1단계: API 키 보호 (즉시 실행)

1. **config.js 파일 생성**
```bash
# config.example.js를 config.js로 복사
cp config.example.js config.js
```

2. **config.js 편집**
```javascript
const config = {
    supabase: {
        url: 'YOUR_ACTUAL_SUPABASE_URL',  // 실제 URL 입력
        anonKey: 'YOUR_ACTUAL_ANON_KEY'   // 실제 키 입력
    },
    slack: {
        webhookUrl: 'YOUR_SLACK_WEBHOOK'   // 실제 webhook URL
    }
};
```

3. **기존 파일 수정**
```javascript
// supabase-config.js 수정
import config from './config.js';
const SUPABASE_URL = config.supabase.url;
const SUPABASE_ANON_KEY = config.supabase.anonKey;
```

4. **Git에서 제외 확인**
```bash
# .gitignore에 추가되었는지 확인
cat .gitignore | grep config.js
```

### 2단계: XSS 방지 적용

1. **security-utils.js import**
```html
<!-- index.html, form.html에 추가 -->
<script src="security-utils.js"></script>
```

2. **위험한 코드 수정**
```javascript
// ❌ 위험한 코드
element.innerHTML = userInput;

// ✅ 안전한 코드
import { setSafeText } from './security-utils.js';
setSafeText(element, userInput);
```

### 3단계: 관리자 인증 개선

1. **임시 해결책 (즉시)**
```javascript
// admin-login.html 수정
async function adminLogin() {
    const password = document.getElementById('password').value;
    
    // SHA-256 해시 사용
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashHex = Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    
    // 해시값 비교 (실제 해시값으로 교체)
    const ADMIN_PASSWORD_HASH = 'YOUR_PASSWORD_HASH_HERE';
    
    if (hashHex === ADMIN_PASSWORD_HASH) {
        sessionStorage.setItem('admin_logged_in', 'true');
        // 세션 타임아웃 설정
        SecurityUtils.setupSessionTimeout(30 * 60 * 1000); // 30분
    }
}
```

## 📋 보안 체크리스트

### 🔴 크리티컬 (24시간 내)
- [ ] Supabase API 키를 config.js로 이동
- [ ] Slack Webhook URL을 config.js로 이동  
- [ ] config.js를 .gitignore에 추가
- [ ] 모든 innerHTML을 안전한 방법으로 교체
- [ ] 관리자 비밀번호 해시화
- [ ] HTTPS 사용 확인

### 🟡 높음 (1주일 내)
- [ ] 입력 검증 함수 적용
- [ ] SQL Injection 방지
- [ ] CSRF 토큰 구현
- [ ] 세션 타임아웃 설정
- [ ] CSP 헤더 추가

### 🟢 중간 (1개월 내)
- [ ] 백엔드 API 서버 구축
- [ ] JWT 토큰 인증
- [ ] Rate Limiting
- [ ] 로깅 시스템
- [ ] 보안 테스트 자동화

## 🛠️ 도구 및 리소스

### 보안 테스트 도구
```bash
# XSS 테스트
npm install -g xss-scanner

# 의존성 취약점 검사
npm audit

# OWASP ZAP 스캔
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://your-site.com
```

### 유용한 라이브러리
- **DOMPurify**: XSS 방지
- **bcrypt**: 비밀번호 해싱
- **helmet**: Express 보안 헤더
- **express-rate-limit**: API 제한

## 🚨 긴급 상황 대응

### API 키 노출 시
1. **즉시 Supabase 대시보드에서 키 재발급**
2. 새 키로 config.js 업데이트
3. 모든 배포 환경 업데이트
4. 접근 로그 확인

### 해킹 시도 감지 시
1. 서비스 일시 중단
2. 로그 백업
3. 보안 패치 적용
4. 점진적 서비스 재개

## 📚 참고 문서

- [OWASP Top 10](https://owasp.org/Top10/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/security)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [KISA 보안 가이드](https://www.kisa.or.kr)

## 📞 지원

보안 이슈 발견 시:
- 이메일: security@the-realty.com
- 긴급: 010-XXXX-XXXX

---

**⚠️ 경고: 이 문서의 지침을 따르지 않을 경우 심각한 보안 사고가 발생할 수 있습니다.**

*최종 업데이트: 2025년 8월 17일*