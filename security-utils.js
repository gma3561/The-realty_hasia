// 보안 유틸리티 함수들

/**
 * HTML 이스케이프 함수 - XSS 방지
 * @param {string} unsafe - 이스케이프할 문자열
 * @returns {string} 안전한 문자열
 */
export function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\//g, "&#x2F;");
}

/**
 * 안전한 텍스트 설정
 * @param {HTMLElement} element - DOM 요소
 * @param {string} text - 설정할 텍스트
 */
export function setSafeText(element, text) {
    if (!element) return;
    element.textContent = text || '';
}

/**
 * 안전한 HTML 설정 (제한된 태그만 허용)
 * @param {HTMLElement} element - DOM 요소
 * @param {string} html - HTML 문자열
 * @param {Array} allowedTags - 허용할 태그 목록
 */
export function setSafeHtml(element, html, allowedTags = ['b', 'i', 'em', 'strong', 'span']) {
    if (!element) return;
    
    // 간단한 화이트리스트 기반 필터링
    const cleaned = sanitizeHtml(html, allowedTags);
    element.innerHTML = cleaned;
}

/**
 * HTML 삭제 - 기본 구현 (DOMPurify 없이)
 * @param {string} dirty - 정화할 HTML
 * @param {Array} allowedTags - 허용할 태그들
 * @returns {string} 정화된 HTML
 */
function sanitizeHtml(dirty, allowedTags) {
    if (!dirty) return '';
    
    // 임시 DOM 요소 생성
    const temp = document.createElement('div');
    temp.innerHTML = escapeHtml(dirty);
    
    // 허용된 태그만 복원
    allowedTags.forEach(tag => {
        const regex = new RegExp(`&lt;(${tag})(\\s[^&]*)?&gt;`, 'gi');
        const closeRegex = new RegExp(`&lt;\\/${tag}&gt;`, 'gi');
        
        temp.innerHTML = temp.innerHTML
            .replace(regex, '<$1$2>')
            .replace(closeRegex, '</$1>');
    });
    
    return temp.innerHTML;
}

/**
 * 입력 검증 함수
 * @param {string} input - 검증할 입력값
 * @param {string} type - 검증 타입
 * @returns {boolean} 유효성 여부
 */
export function validateInput(input, type) {
    const validators = {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^[0-9-()+ ]+$/,
        number: /^\d+$/,
        price: /^[\d,]+원?$/,
        korean: /^[가-힣\s]+$/,
        alphanumeric: /^[a-zA-Z0-9]+$/,
        noScript: /<script|javascript:|on\w+=/i
    };
    
    if (type === 'noScript') {
        return !validators.noScript.test(input);
    }
    
    return validators[type] ? validators[type].test(input) : true;
}

/**
 * SQL Injection 방지용 파라미터 정화
 * @param {string} input - 정화할 입력값
 * @returns {string} 정화된 입력값
 */
export function sanitizeSqlParam(input) {
    if (typeof input !== 'string') return '';
    
    // 위험한 SQL 키워드 제거
    const dangerous = [
        'DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER',
        'CREATE', 'TRUNCATE', 'EXEC', 'EXECUTE',
        '--', '/*', '*/', 'xp_', 'sp_'
    ];
    
    let cleaned = input;
    dangerous.forEach(keyword => {
        const regex = new RegExp(keyword, 'gi');
        cleaned = cleaned.replace(regex, '');
    });
    
    // 특수문자 이스케이프
    return cleaned
        .replace(/'/g, "''")
        .replace(/;/g, '')
        .replace(/--/g, '');
}

/**
 * CSRF 토큰 생성
 * @returns {string} CSRF 토큰
 */
export function generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 세션 타임아웃 관리
 * @param {number} timeout - 타임아웃 시간 (밀리초)
 */
export function setupSessionTimeout(timeout = 30 * 60 * 1000) { // 기본 30분
    let timer;
    
    const resetTimer = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            // 세션 만료 처리
            sessionStorage.clear();
            alert('세션이 만료되었습니다. 다시 로그인해주세요.');
            window.location.href = '/';
        }, timeout);
    };
    
    // 사용자 활동 감지
    ['mousedown', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, resetTimer, true);
    });
    
    resetTimer();
}

/**
 * 안전한 JSON 파싱
 * @param {string} jsonString - JSON 문자열
 * @returns {Object|null} 파싱된 객체 또는 null
 */
export function safeJsonParse(jsonString) {
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error('JSON 파싱 오류:', e);
        return null;
    }
}

/**
 * 보안 헤더 확인
 */
export function checkSecurityHeaders() {
    const warnings = [];
    
    // Content-Security-Policy 확인
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
        warnings.push('Content-Security-Policy 헤더가 설정되지 않았습니다.');
    }
    
    // HTTPS 확인
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        warnings.push('HTTPS를 사용하지 않고 있습니다.');
    }
    
    return warnings;
}

/**
 * 민감한 데이터 마스킹
 * @param {string} data - 마스킹할 데이터
 * @param {string} type - 데이터 타입
 * @returns {string} 마스킹된 데이터
 */
export function maskSensitiveData(data, type = 'default') {
    if (!data) return '';
    
    const masks = {
        phone: (str) => str.replace(/(\d{3})(\d{4})(\d{4})/, '$1-****-$3'),
        email: (str) => str.replace(/^(.{2})(.*)(@.*)$/, '$1***$3'),
        name: (str) => str.length > 1 ? str[0] + '*'.repeat(str.length - 1) : str,
        default: (str) => str.length > 4 ? str.substr(0, 2) + '***' + str.substr(-2) : '***'
    };
    
    return masks[type] ? masks[type](data) : masks.default(data);
}

// 전역 보안 설정
export function initializeSecurity() {
    // XSS 방지를 위한 기본 CSP 설정
    const csp = document.createElement('meta');
    csp.httpEquiv = 'Content-Security-Policy';
    csp.content = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co";
    document.head.appendChild(csp);
    
    // 세션 타임아웃 설정
    if (sessionStorage.getItem('admin_logged_in')) {
        setupSessionTimeout();
    }
    
    // 보안 헤더 확인
    const warnings = checkSecurityHeaders();
    if (warnings.length > 0) {
        console.warn('보안 경고:', warnings);
    }
    
    // 우클릭 방지 (선택적)
    // document.addEventListener('contextmenu', e => e.preventDefault());
    
    console.log('보안 초기화 완료');
}

// 모듈 내보내기
window.SecurityUtils = {
    escapeHtml,
    setSafeText,
    setSafeHtml,
    validateInput,
    sanitizeSqlParam,
    generateCSRFToken,
    setupSessionTimeout,
    safeJsonParse,
    checkSecurityHeaders,
    maskSensitiveData,
    initializeSecurity
};