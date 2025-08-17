// 환경 변수 설정 예제
// 이 파일을 config.js로 복사하고 실제 값을 입력하세요
// config.js는 .gitignore에 추가해야 합니다

const config = {
    // Supabase 설정
    supabase: {
        url: 'YOUR_SUPABASE_URL',
        anonKey: 'YOUR_SUPABASE_ANON_KEY'
    },
    
    // Slack 설정
    slack: {
        webhookUrl: 'YOUR_SLACK_WEBHOOK_URL'
    },
    
    // 관리자 설정 (서버에서 처리해야 함)
    admin: {
        // 클라이언트에 비밀번호를 저장하지 마세요!
        // 서버 API를 통해 인증해야 합니다
        apiEndpoint: '/api/admin/login'
    }
};

// 개발/프로덕션 환경 분리
if (window.location.hostname === 'localhost') {
    // 개발 환경 설정
    config.apiBaseUrl = 'http://localhost:3000';
} else {
    // 프로덕션 환경 설정
    config.apiBaseUrl = 'https://api.the-realty.com';
}

export default config;