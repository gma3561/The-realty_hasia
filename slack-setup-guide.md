# 슬랙 연동 설정 가이드

## 1. 슬랙 웹훅 URL 생성

### 1.1 Slack App 생성
1. [Slack API](https://api.slack.com/apps) 접속
2. "Create New App" 클릭
3. "From scratch" 선택
4. App 이름: "더부동산 매물 알림" (또는 원하는 이름)
5. Workspace 선택

### 1.2 Incoming Webhooks 활성화
1. 좌측 메뉴에서 "Incoming Webhooks" 클릭
2. "Activate Incoming Webhooks" 토글 ON
3. "Add New Webhook to Workspace" 클릭
4. 메시지를 받을 채널 선택
5. "Allow" 클릭

### 1.3 Webhook URL 복사
1. 생성된 Webhook URL 복사
   예: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`

## 2. 코드에 웹훅 URL 설정

### 2.1 slack-config.js 파일 수정
```javascript
// slack-config.js 파일 열기
const SLACK_WEBHOOK_URL = 'YOUR_SLACK_WEBHOOK_URL'; // 여기에 복사한 URL 붙여넣기
```

실제 예시:
```javascript
const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX';
```

## 3. 사용 방법

### 3.1 매물 상세 페이지에서 전송
1. 매물 목록에서 매물 클릭
2. 상세 정보 패널/모달 열림
3. "🔗 슬랙으로 전송" 버튼 클릭
4. 슬랙 채널에 메시지 전송됨

### 3.2 전송되는 정보
- 매물 기본 정보 (번호, 상태, 담당자)
- 거래 정보 (유형, 금액)
- 위치 정보 (주소, 동/호)
- 면적 정보 (㎡, 평, 층수)
- 특이사항
- 담당자 메모

## 4. 메시지 형식 커스터마이징

### 4.1 이모지 변경
`slack-config.js`의 `formatPropertyForSlack` 함수에서 수정:

```javascript
const statusEmoji = {
    '거래가능': '🟢',  // 원하는 이모지로 변경
    '거래완료': '🔴',
    '거래철회': '⚫',
    '매물검토': '🟡'
};
```

### 4.2 메시지 필드 추가/제거
`blocks` 배열에서 섹션 추가/제거:

```javascript
// 새 섹션 추가 예시
blocks.push({
    type: "section",
    text: {
        type: "mrkdwn",
        text: `*추가 정보:*\n${property.custom_field}`
    }
});
```

## 5. 보안 주의사항

### ⚠️ 중요
- **절대 GitHub 등 공개 저장소에 실제 Webhook URL을 올리지 마세요**
- 환경변수나 별도 설정 파일로 관리 권장
- `.gitignore`에 설정 파일 추가

### 5.1 환경변수 사용 (Vercel)
1. Vercel 대시보드 > Settings > Environment Variables
2. 변수 추가: `SLACK_WEBHOOK_URL`
3. 코드에서 사용:
```javascript
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || 'YOUR_SLACK_WEBHOOK_URL';
```

## 6. 테스트

### 6.1 연결 테스트
브라우저 콘솔에서:
```javascript
testSlackConnection()
```

### 6.2 문제 해결
- **CORS 에러**: Webhook URL이 올바른지 확인
- **404 에러**: Webhook URL이 유효한지 확인
- **메시지 안 옴**: 슬랙 채널 및 권한 확인

## 7. 추가 기능 (선택사항)

### 7.1 자동 알림 활성화
`slack-integration.js`에서 주석 해제:
```javascript
// 페이지 로드 시 자동 알림 설정
document.addEventListener('DOMContentLoaded', function() {
    setupAutoNotifications(); // 주석 해제
});
```

이렇게 하면:
- 새 매물 등록 시 자동 알림
- 매물 상태 변경 시 자동 알림

### 7.2 채널별 전송
다른 채널로 전송하려면:
1. 각 채널별 Webhook URL 생성
2. 조건에 따라 다른 URL 사용

```javascript
const SLACK_URLS = {
    general: 'https://hooks.slack.com/...',
    urgent: 'https://hooks.slack.com/...',
    completed: 'https://hooks.slack.com/...'
};

// 상태에 따라 다른 채널로 전송
const webhookUrl = property.status === '거래완료' 
    ? SLACK_URLS.completed 
    : SLACK_URLS.general;
```