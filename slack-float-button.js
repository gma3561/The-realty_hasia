// 플로팅 슬랙 버튼 구현

// 슬랙 버튼 HTML 생성
function createFloatingSlackButton() {
    const buttonHTML = `
        <div id="floatingSlackButton" class="floating-slack-button" style="display: none;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <!-- 슬랙 로고 SVG -->
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"/>
                <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"/>
                <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"/>
                <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
            </svg>
            <span class="slack-tooltip">슬랙으로 전송</span>
        </div>
    `;
    
    // DOM에 추가
    document.body.insertAdjacentHTML('beforeend', buttonHTML);
    
    // 이벤트 리스너 추가
    const button = document.getElementById('floatingSlackButton');
    button.addEventListener('click', handleSlackButtonClick);
    
    // 스크롤 시 버튼 위치 조정
    let lastScrollTop = 0;
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop) {
            // 스크롤 다운
            button.style.transform = 'translateY(100px)';
        } else {
            // 스크롤 업
            button.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, false);
}

// 슬랙 버튼 표시/숨기기
function showSlackButton() {
    const button = document.getElementById('floatingSlackButton');
    if (button) {
        button.style.display = 'flex';
        // 페이드 인 애니메이션
        setTimeout(() => {
            button.style.opacity = '1';
        }, 10);
    }
}

function hideSlackButton() {
    const button = document.getElementById('floatingSlackButton');
    if (button) {
        button.style.opacity = '0';
        setTimeout(() => {
            button.style.display = 'none';
        }, 300);
    }
}

// 슬랙 버튼 클릭 핸들러
async function handleSlackButtonClick() {
    const button = document.getElementById('floatingSlackButton');
    
    // 선택된 매물이 있는지 확인 (상세보기가 열린 상태에서는 항상 있음)
    if (!window.currentPropertyId) {
        showToast('매물 정보를 찾을 수 없습니다', 'warning');
        return;
    }
    
    // 로딩 상태
    button.classList.add('loading');
    
    try {
        // 매물 데이터 가져오기
        const property = await getCurrentPropertyDataSimple();
        
        if (!property) {
            throw new Error('매물 정보를 가져올 수 없습니다');
        }
        
        // 간단한 텍스트 메시지 생성
        const message = formatPropertyAsSimpleText(property);
        
        // 슬랙으로 전송
        const result = await sendSimplePropertyToSlack(message);
        
        if (result) {
            showToast('슬랙으로 전송되었습니다', 'success');
            
            // 성공 애니메이션
            button.classList.add('success');
            setTimeout(() => button.classList.remove('success'), 2000);
        } else {
            throw new Error('전송 실패');
        }
        
    } catch (error) {
        console.error('슬랙 전송 오류:', error);
        showToast('전송 실패: ' + error.message, 'error');
        
        // 에러 애니메이션
        button.classList.add('error');
        setTimeout(() => button.classList.remove('error'), 2000);
    } finally {
        button.classList.remove('loading');
    }
}

// 매물 정보를 간단한 텍스트로 포맷
function formatPropertyAsSimpleText(property) {
    const lines = [];
    
    // 헤더
    lines.push(`📋 매물정보 #${property.id || '-'}`);
    lines.push('─'.repeat(30));
    
    // 기본 정보
    lines.push(`📅 등록일: ${formatDate(property.register_date)}`);
    lines.push(`👤 담당자: ${property.manager || '-'}`);
    lines.push(`📌 상태: ${property.status || '-'}`);
    
    // 매물 정보
    lines.push(`🏠 매물명: ${property.property_name || '-'}`);
    lines.push(`📍 종류: ${property.property_type || '-'}`);
    lines.push(`💰 거래: ${property.trade_type || '-'} / ${property.price || '-'}`);
    
    // 위치 정보
    if (property.address) {
        lines.push(`📍 주소: ${property.address}`);
    }
    if (property.dong || property.ho) {
        lines.push(`🏢 동/호: ${property.dong || '-'}동 ${property.ho || '-'}호`);
    }
    
    // 면적 정보
    if (property.supply_area_pyeong) {
        lines.push(`📐 면적: ${property.supply_area_pyeong}평`);
    }
    if (property.floor_current || property.floor_total) {
        lines.push(`🏗️ 층수: ${property.floor_current || '-'}/${property.floor_total || '-'}층`);
    }
    
    // 공유 여부
    lines.push(`🔗 공유: ${property.shared ? '공유' : '비공유'}`);
    
    // 푸터
    lines.push('─'.repeat(30));
    lines.push(`🏢 더부동산중개법인`);
    lines.push(`⏰ ${new Date().toLocaleString('ko-KR')}`);
    
    return lines.join('\n');
}

// 간단한 매물 데이터 수집 (목록에 표시되는 정보만)
async function getCurrentPropertyDataSimple() {
    // 테이블에서 현재 선택된 행 찾기
    const selectedRow = document.querySelector(`tr[data-property-id="${window.currentPropertyId}"]`);
    
    if (selectedRow) {
        // 테이블 행에서 직접 데이터 추출
        const cells = selectedRow.querySelectorAll('td');
        return {
            id: window.currentPropertyId,
            register_date: cells[0]?.textContent,
            manager: cells[13]?.textContent,
            status: cells[2]?.textContent,
            property_type: cells[3]?.textContent,
            trade_type: cells[4]?.textContent,
            price: cells[5]?.textContent,
            property_name: cells[6]?.textContent,
            dong: cells[7]?.textContent,
            ho: cells[8]?.textContent,
            supply_area_sqm: cells[9]?.textContent,
            supply_area_pyeong: cells[10]?.textContent,
            floor_current: cells[11]?.textContent?.split('/')[0],
            floor_total: cells[11]?.textContent?.split('/')[1],
            shared: cells[12]?.textContent === '공유'
        };
    }
    
    // 백업: 상세 패널에서 데이터 가져오기
    return getCurrentPropertyData();
}

// 간단한 텍스트를 슬랙으로 전송
async function sendSimplePropertyToSlack(message) {
    try {
        const payload = {
            text: message
        };
        
        const response = await fetch(SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        return response.ok;
        
    } catch (error) {
        console.error('슬랙 전송 오류:', error);
        return false;
    }
}

// 토스트 메시지 표시
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 애니메이션
    setTimeout(() => toast.classList.add('show'), 10);
    
    // 3초 후 제거
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 스타일 추가
const floatingSlackStyles = `
<style>
/* 플로팅 슬랙 버튼 */
.floating-slack-button {
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 56px;
    height: 56px;
    background: #4A154B;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(74, 21, 75, 0.3);
    transition: all 0.3s ease;
    z-index: 9999;
    opacity: 0;
}

.floating-slack-button:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(74, 21, 75, 0.4);
}

.floating-slack-button:active {
    transform: scale(0.95);
}

/* 로딩 상태 */
.floating-slack-button.loading {
    animation: pulse 1.5s infinite;
    pointer-events: none;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.6; }
    100% { opacity: 1; }
}

/* 성공 상태 */
.floating-slack-button.success {
    background: #2ecc71;
    animation: bounce 0.5s;
}

/* 에러 상태 */
.floating-slack-button.error {
    background: #e74c3c;
    animation: shake 0.5s;
}

/* 흔들기 애니메이션 */
.floating-slack-button.shake {
    animation: shake 0.5s;
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
}

@keyframes bounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
}

/* 툴팁 */
.slack-tooltip {
    position: absolute;
    bottom: 70px;
    right: 0;
    background: #333;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s;
}

.floating-slack-button:hover .slack-tooltip {
    opacity: 1;
}

.slack-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    right: 20px;
    border: 6px solid transparent;
    border-top-color: #333;
}

/* 토스트 메시지 */
.toast {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-size: 14px;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
    z-index: 10000;
    max-width: 300px;
}

.toast.show {
    opacity: 1;
    transform: translateX(0);
}

.toast-success {
    background: #2ecc71;
}

.toast-error {
    background: #e74c3c;
}

.toast-warning {
    background: #f39c12;
}

.toast-info {
    background: #3498db;
}

/* 모바일 조정 */
@media (max-width: 768px) {
    .floating-slack-button {
        bottom: 20px;
        right: 20px;
        width: 48px;
        height: 48px;
    }
    
    .floating-slack-button svg {
        width: 20px;
        height: 20px;
    }
    
    .slack-tooltip {
        display: none;
    }
    
    .toast {
        left: 20px;
        right: 20px;
        max-width: none;
    }
}

/* 스크롤 시 숨기기 애니메이션 */
.floating-slack-button {
    transition: transform 0.3s ease;
}

/* 기존 슬랙 버튼 숨기기 */
.property-actions,
.slack-send-btn,
.btn-slack {
    display: none !important;
}
</style>
`;

// 스타일 주입
if (!document.querySelector('#floating-slack-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'floating-slack-styles';
    styleElement.innerHTML = floatingSlackStyles;
    document.head.appendChild(styleElement.firstElementChild);
}

// 페이지 로드 시 버튼 생성
document.addEventListener('DOMContentLoaded', function() {
    createFloatingSlackButton();
});

// 테이블 행 클릭 시 property ID 저장 및 슬랙 버튼 표시
document.addEventListener('click', function(e) {
    const row = e.target.closest('tr');
    if (row && row.parentElement && row.parentElement.id === 'tableBody') {
        // onclick 속성에서 ID 추출
        const onclickAttr = row.getAttribute('onclick');
        const match = onclickAttr?.match(/showPropertyDetails\((\d+)\)/);
        if (match) {
            window.currentPropertyId = match[1];
            
            // 모든 행의 선택 상태 제거
            document.querySelectorAll('#tableBody tr').forEach(tr => {
                tr.removeAttribute('data-selected');
            });
            
            // 현재 행에 선택 상태 추가
            row.setAttribute('data-selected', 'true');
            row.setAttribute('data-property-id', match[1]);
            
            // 슬랙 버튼 표시
            setTimeout(() => showSlackButton(), 200);
        }
    }
    
    // 사이드 패널이나 모달이 열려있는지 확인
    const sidePanel = document.getElementById('sidePanel');
    const modal = document.getElementById('detailModal');
    
    if ((sidePanel && sidePanel.classList.contains('open')) || 
        (modal && modal.style.display === 'block')) {
        // 상세보기가 열려있으면 슬랙 버튼 표시
        showSlackButton();
    }
});

// showPropertyDetails 함수 오버라이드를 위한 대기
setTimeout(() => {
    const originalShowPropertyDetails = window.showPropertyDetails;
    if (originalShowPropertyDetails) {
        window.showPropertyDetails = function(propertyId) {
            // 원래 함수 실행
            originalShowPropertyDetails.call(this, propertyId);
            // 슬랙 버튼 표시
            setTimeout(() => showSlackButton(), 100);
        };
    }
}, 1000);

// 상세보기 닫기 함수들 오버라이드를 위한 대기
setTimeout(() => {
    const originalCloseSidePanel = window.closeSidePanel;
    if (originalCloseSidePanel) {
        window.closeSidePanel = function() {
            // 원래 함수 실행
            originalCloseSidePanel.call(this);
            // 슬랙 버튼 숨기기
            hideSlackButton();
        };
    }

    const originalCloseModal = window.closeModal;
    if (originalCloseModal) {
        window.closeModal = function() {
            // 원래 함수 실행
            originalCloseModal.call(this);
            // 슬랙 버튼 숨기기
            hideSlackButton();
        };
    }
}, 1000);

// ESC 키나 오버레이 클릭으로 닫을 때도 처리
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        hideSlackButton();
    }
});

document.getElementById('overlay')?.addEventListener('click', function() {
    hideSlackButton();
});