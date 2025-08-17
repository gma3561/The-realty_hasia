// 복사 방지 및 보안 스크립트 (임시 비활성화)
// 개발/테스트 중에는 보안 기능을 비활성화합니다.

/*
// 복사 방지 및 보안 스크립트

// 우클릭 방지
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
});

// 키보드 단축키 방지
document.addEventListener('keydown', function(e) {
    // Ctrl+C, Ctrl+A, Ctrl+V, Ctrl+X, Ctrl+S, Ctrl+P 방지
    if (e.ctrlKey && (
        e.keyCode === 67 || // C
        e.keyCode === 65 || // A  
        e.keyCode === 86 || // V
        e.keyCode === 88 || // X
        e.keyCode === 83 || // S
        e.keyCode === 80    // P
    )) {
        e.preventDefault();
        return false;
    }
    
    // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U 개발자 도구 방지
    if (
        e.keyCode === 123 || // F12
        (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
        (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
        (e.ctrlKey && e.keyCode === 85) // Ctrl+U
    ) {
        e.preventDefault();
        return false;
    }
    
    // Ctrl+Shift+C (개발자 도구 요소 선택)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
        e.preventDefault();
        return false;
    }
});

// 드래그 시작 방지
document.addEventListener('dragstart', function(e) {
    e.preventDefault();
    return false;
});

// 선택 방지 (이벤트로도 추가 차단)
document.addEventListener('selectstart', function(e) {
    // 입력 필드는 예외 처리
    if (e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA' || 
        e.target.tagName === 'SELECT' ||
        e.target.contentEditable === 'true') {
        return true;
    }
    e.preventDefault();
    return false;
});

// 모바일에서 길게 누르기 방지
document.addEventListener('touchstart', function(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
});

let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// 텍스트 복사 시도 감지 및 차단
document.addEventListener('copy', function(e) {
    e.clipboardData.setData('text/plain', '');
    e.preventDefault();
    return false;
});

// 개발자 도구 감지 및 보안 위반 경고
// ... (나머지 보안 기능들)
*/

console.log('보안 기능이 임시로 비활성화되었습니다.');