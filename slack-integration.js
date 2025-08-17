// 슬랙 연동 스크립트 - 매물 정보 전송 및 알림 기능

// 현재 표시 중인 매물 정보 가져오기
async function getCurrentPropertyData() {
    // 사이드 패널 또는 모달에서 현재 매물 ID 가져오기
    if (!window.currentPropertyId) {
        alert('선택된 매물이 없습니다.');
        return null;
    }
    
    // Supabase에서 매물 정보 조회
    if (window.getPropertyById) {
        const { data, error } = await getPropertyById(window.currentPropertyId);
        if (error) {
            console.error('매물 정보 조회 실패:', error);
            return null;
        }
        return data;
    }
    
    // 대체 방법: DOM에서 직접 데이터 수집
    return collectPropertyDataFromDOM();
}

// DOM에서 매물 정보 수집 (백업 방법)
function collectPropertyDataFromDOM() {
    const isMobile = window.innerWidth <= 768;
    const prefix = isMobile ? 'mobile' : 'side';
    
    const property = {
        id: window.currentPropertyId,
        property_name: document.getElementById(`${prefix}PanelTitle`)?.textContent || 
                       document.getElementById(`${prefix}Property`)?.textContent,
        shared: document.getElementById(`${prefix}Shared`)?.textContent === '공유',
        manager: document.getElementById(`${prefix}Manager`)?.textContent,
        status: document.getElementById(`${prefix}Status`)?.textContent,
        re_register_reason: document.getElementById(`${prefix}Reason`)?.textContent,
        property_type: document.getElementById(`${prefix}Type`)?.textContent,
        dong: document.getElementById(`${prefix}Dong`)?.textContent,
        ho: document.getElementById(`${prefix}Unit`)?.textContent,
        address: document.getElementById(`${prefix}Address`)?.textContent,
        trade_type: document.getElementById(`${prefix}Trade`)?.textContent,
        price: document.getElementById(`${prefix}Price`)?.textContent,
        supply_area_sqm: document.getElementById(`${prefix}SupplyArea`)?.textContent,
        supply_area_pyeong: document.getElementById(`${prefix}SupplyPyeong`)?.textContent,
        floor_current: document.getElementById(`${prefix}FloorInfo`)?.textContent?.split('/')[0],
        floor_total: document.getElementById(`${prefix}FloorInfo`)?.textContent?.split('/')[1]?.replace('층', ''),
        rooms: document.getElementById(`${prefix}Rooms`)?.textContent,
        direction: document.getElementById(`${prefix}Direction`)?.textContent,
        parking: document.getElementById(`${prefix}Parking`)?.textContent,
        management_fee: document.getElementById(`${prefix}ManagementFee`)?.textContent,
        move_in_date: document.getElementById(`${prefix}MoveInDate`)?.textContent,
        approval_date: document.getElementById(`${prefix}ApprovalDate`)?.textContent,
        register_date: document.getElementById(`${prefix}RegisterDate`)?.textContent,
        special_notes: document.getElementById(`${prefix}Special`)?.textContent,
        manager_memo: document.getElementById(`${prefix}Memo`)?.textContent
    };
    
    // '-' 값을 null로 변환
    Object.keys(property).forEach(key => {
        if (property[key] === '-' || property[key] === '') {
            property[key] = null;
        }
    });
    
    return property;
}

// 현재 매물을 슬랙으로 전송 (기존 함수와 호환성 유지)
async function sendPropertyToSlack(property) {
    try {
        // 로딩 표시
        showSlackLoading(true);
        
        // 새로운 알림 시스템 사용
        const result = await notifySlackSend(property, '사용자');
        
        if (result) {
            showSlackSuccess();
            console.log('슬랙 전송 성공');
        } else {
            throw new Error('슬랙 전송 실패');
        }
        
        return result;
        
    } catch (error) {
        console.error('슬랙 전송 중 오류:', error);
        showSlackError(error.message);
        return false;
    } finally {
        showSlackLoading(false);
    }
}

// 현재 매물을 슬랙으로 전송 (새로운 함수명)
async function sendCurrentPropertyToSlack() {
    try {
        // 매물 데이터 가져오기
        const property = await getCurrentPropertyData();
        
        if (!property) {
            alert('매물 정보를 가져올 수 없습니다.');
            return;
        }
        
        // 슬랙으로 전송
        const result = await sendPropertyToSlack(property);
        
        if (result) {
            console.log('슬랙 전송 성공');
        } else {
            console.log('슬랙 전송 실패');
        }
        
    } catch (error) {
        console.error('슬랙 전송 중 오류:', error);
        alert('슬랙 전송 중 오류가 발생했습니다.');
    }
}

// 매물 등록 후 자동 알림 설정
function setupAutoNotifications() {
    // 원래 insertProperty 함수를 래핑
    if (window.insertProperty) {
        const originalInsert = window.insertProperty;
        window.insertProperty = async function(propertyData) {
            const result = await originalInsert(propertyData);
            
            // 성공적으로 등록되면 슬랙 알림
            if (result && result.success && !result.error) {
                await notifyNewProperty(result.data);
            }
            
            return result;
        };
    }
    
    // 원래 updateProperty 함수를 래핑
    if (window.updateProperty) {
        const originalUpdate = window.updateProperty;
        window.updateProperty = async function(id, propertyData) {
            // 이전 상태 저장
            let oldStatus = null;
            if (window.getPropertyById) {
                const { data } = await getPropertyById(id);
                oldStatus = data?.status;
            }
            
            const result = await originalUpdate(id, propertyData);
            
            // 상태가 변경되면 슬랙 알림
            if (result && result.success && !result.error) {
                if (oldStatus && oldStatus !== result.data.status) {
                    await notifyStatusChange(result.data, oldStatus, result.data.status);
                }
            }
            
            return result;
        };
    }
}

// UI 피드백 함수들
function showSlackLoading(show) {
    const button = document.querySelector('.slack-send-btn');
    if (button) {
        if (show) {
            button.disabled = true;
            button.textContent = '전송 중...';
            button.classList.add('loading');
        } else {
            button.disabled = false;
            button.textContent = '슬랙으로 전송';
            button.classList.remove('loading');
        }
    }
}

function showSlackSuccess() {
    // 성공 토스트 메시지
    const toast = document.createElement('div');
    toast.className = 'slack-toast success';
    toast.innerHTML = `
        <span>✅ 슬랙으로 전송되었습니다!</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showSlackError(message) {
    // 에러 토스트 메시지
    const toast = document.createElement('div');
    toast.className = 'slack-toast error';
    toast.innerHTML = `
        <span>❌ 전송 실패: ${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// 슬랙 토스트 스타일 추가
const slackStyles = `
<style>
.slack-toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 16px 24px;
    border-radius: 8px;
    color: white;
    font-size: 14px;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.slack-toast.success {
    background: #2ecc71;
}

.slack-toast.error {
    background: #e74c3c;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.slack-send-btn.loading {
    opacity: 0.7;
    cursor: not-allowed;
}

.slack-send-btn:hover:not(.loading) {
    background: #611f69 !important;
}

.property-actions {
    display: flex;
    gap: 10px;
    padding: 20px;
    border-top: 1px solid #e0e0e0;
}

.property-actions button {
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;
}

.btn-edit {
    background: #f0f0f0;
    color: #333;
}

.btn-edit:hover {
    background: #e0e0e0;
}

@media (max-width: 768px) {
    .slack-toast {
        left: 20px;
        right: 20px;
    }
}
</style>
`;

// 스타일 주입
if (!document.querySelector('#slack-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'slack-styles';
    styleElement.innerHTML = slackStyles;
    document.head.appendChild(styleElement.firstElementChild);
}

// 페이지 로드 시 자동 알림 설정
document.addEventListener('DOMContentLoaded', function() {
    // 자동 알림 설정
    setupAutoNotifications();
});

// 전역 함수로 노출
window.sendCurrentPropertyToSlack = sendCurrentPropertyToSlack;
window.sendPropertyToSlack = sendPropertyToSlack;
window.setupAutoNotifications = setupAutoNotifications;