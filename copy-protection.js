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

// 개발자 도구 감지 및 경고
let devtools = {
    open: false,
    orientation: null
};

const threshold = 160;

function showDevToolsWarning() {
    // 기존 경고창이 있으면 제거
    const existingWarning = document.getElementById('devtools-warning');
    if (existingWarning) {
        existingWarning.remove();
    }
    
    // 접속 정보 수집
    const now = new Date();
    const accessTime = now.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Seoul'
    });
    
    const userAgent = navigator.userAgent;
    let deviceInfo = '';
    let browserInfo = '';
    
    // 디바이스 정보 분석
    if (/iPhone/i.test(userAgent)) {
        deviceInfo = 'iPhone';
    } else if (/iPad/i.test(userAgent)) {
        deviceInfo = 'iPad';
    } else if (/Android/i.test(userAgent)) {
        deviceInfo = 'Android 기기';
    } else if (/Windows/i.test(userAgent)) {
        deviceInfo = 'Windows PC';
    } else if (/Mac/i.test(userAgent)) {
        deviceInfo = 'Mac';
    } else if (/Linux/i.test(userAgent)) {
        deviceInfo = 'Linux';
    } else {
        deviceInfo = '알 수 없는 기기';
    }
    
    // 브라우저 정보 분석
    if (/Chrome/i.test(userAgent)) {
        browserInfo = 'Chrome';
    } else if (/Safari/i.test(userAgent)) {
        browserInfo = 'Safari';
    } else if (/Firefox/i.test(userAgent)) {
        browserInfo = 'Firefox';
    } else if (/Edge/i.test(userAgent)) {
        browserInfo = 'Edge';
    } else {
        browserInfo = '알 수 없는 브라우저';
    }
    
    // IP 주소 정보 (클라이언트 측에서는 정확한 IP를 얻기 어려우므로 표시용)
    const connectionInfo = `${deviceInfo} (${browserInfo})`;
    
    // 경고 모달 생성
    const warningModal = document.createElement('div');
    warningModal.id = 'devtools-warning';
    warningModal.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
        ">
            <div style="
                background: white;
                padding: 40px;
                border-radius: 12px;
                text-align: center;
                max-width: 600px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                border: 3px solid #dc2626;
            ">
                <div style="
                    font-size: 60px;
                    margin-bottom: 20px;
                ">🚨</div>
                <h2 style="
                    color: #dc2626;
                    font-size: 28px;
                    margin-bottom: 20px;
                    font-weight: bold;
                ">보안 위반 감지</h2>
                
                <div style="
                    background: #fee2e2;
                    border: 1px solid #fecaca;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                    text-align: left;
                ">
                    <h3 style="
                        color: #dc2626;
                        font-size: 16px;
                        margin-bottom: 12px;
                        font-weight: bold;
                    ">📋 접속 정보</h3>
                    <div style="
                        font-size: 14px;
                        color: #374151;
                        line-height: 1.6;
                        font-family: monospace;
                    ">
                        <strong>접속 일시:</strong> ${accessTime}<br>
                        <strong>접속 기기:</strong> ${connectionInfo}<br>
                        <strong>감지 사항:</strong> 개발자 도구 사용 시도<br>
                        <strong>위험 수준:</strong> <span style="color: #dc2626; font-weight: bold;">높음</span>
                    </div>
                </div>
                
                <p style="
                    color: #374151;
                    font-size: 16px;
                    line-height: 1.6;
                    margin-bottom: 24px;
                ">
                    <strong style="color: #dc2626;">개발자 도구 사용이 감지되었습니다.</strong><br>
                    이 사이트의 모든 내용은 저작권으로 보호되며,<br>
                    무단 복사, 수정, 배포가 금지됩니다.<br><br>
                    <span style="font-size: 14px; color: #6b7280;">
                    위 접속 정보는 보안 목적으로 기록됩니다.
                    </span>
                </p>
                
                <button onclick="closeDevToolsWarning()" style="
                    background: #dc2626;
                    color: white;
                    border: none;
                    padding: 14px 28px;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                    font-weight: 600;
                    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
                ">확인 및 닫기</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(warningModal);
    
    // 콘솔에도 경고 메시지
    console.clear();
    console.log('%c🚨 보안 위반 감지 🚨', 'color: red; font-size: 30px; font-weight: bold; background: yellow; padding: 10px;');
    console.log('%c개발자 도구 사용이 감지되었습니다!', 'color: red; font-size: 18px; font-weight: bold;');
    console.log('%c┌─────────────────────────────────────────┐', 'color: red; font-size: 12px;');
    console.log(`%c│ 접속 일시: ${accessTime}`, 'color: red; font-size: 12px;');
    console.log(`%c│ 접속 기기: ${connectionInfo}`, 'color: red; font-size: 12px;');
    console.log('%c│ 감지 사항: 개발자 도구 사용 시도             │', 'color: red; font-size: 12px;');
    console.log('%c│ 위험 수준: 높음                           │', 'color: red; font-size: 12px;');
    console.log('%c└─────────────────────────────────────────┘', 'color: red; font-size: 12px;');
    console.log('%c이 사이트의 모든 내용은 저작권으로 보호됩니다.', 'color: red; font-size: 14px;');
    console.log('%c무단 복사, 수정, 배포를 금지합니다.', 'color: red; font-size: 14px;');
    console.log('%c위 접속 정보는 보안 목적으로 기록됩니다.', 'color: orange; font-size: 12px;');
}

function closeDevToolsWarning() {
    const warningModal = document.getElementById('devtools-warning');
    if (warningModal) {
        warningModal.remove();
    }
}

// 전역 함수로 등록
window.closeDevToolsWarning = closeDevToolsWarning;

setInterval(function() {
    if (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
            devtools.open = true;
            showDevToolsWarning();
        }
    } else {
        devtools.open = false;
    }
}, 500);

// 추가 개발자 도구 감지 방법들
// DevTools 감지 - 함수 toString 길이 확인
let devtools_running = false;
let check_status = setInterval(function() {
    if (devtools_running) return;
    
    function check() {
        if(window.console && (window.console.firebug || window.console.exception && window.console.table)){
            devtools_running = true;
            showDevToolsWarning();
        }
    }
    
    check();
}, 1000);

// DevTools 감지 - debugger 문 활용
function detectDevTools() {
    let start = new Date();
    debugger;
    let end = new Date();
    if (end - start > 100) {
        if (!devtools_running) {
            devtools_running = true;
            showDevToolsWarning();
        }
    }
}

// 주기적으로 debugger 감지 실행
setInterval(detectDevTools, 3000);

// 콘솔 로그 보호
if (typeof console !== 'undefined') {
    console.log('%c경고!', 'color: red; font-size: 30px; font-weight: bold;');
    console.log('%c여기서 무언가를 입력하면 공격자가 당신의 정보에 접근할 수 있습니다.\n이것은 개발자를 위한 브라우저 기능입니다.', 'color: red; font-size: 14px;');
}