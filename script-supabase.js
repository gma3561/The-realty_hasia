// 매물 목록 페이지 스크립트 (Supabase 연동)

let currentProperties = [];
let currentPropertyId = null;
let realtimeSubscription = null;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function() {
    // Supabase 초기화 확인
    setTimeout(async () => {
        if (!window.supabaseClient) {
            alert('데이터베이스 연결 실패. Supabase 설정을 확인해주세요.');
        } else {
            // 매물 목록 로드
            await loadProperties();
            // 실시간 구독 설정
            setupRealtimeSubscription();
        }
    }, 1000);
    
    // 이벤트 리스너 설정
    setupEventListeners();
});

// 매물 등록 페이지로 이동
function goToForm() {
    window.location.href = 'form.html';
}

// 알림 설정 페이지로 이동
function goToNotificationSettings() {
    window.location.href = 'notification-settings.html';
}

// 매물 목록 로드
async function loadProperties() {
    if (!window.supabaseClient) {
        console.error('Supabase 클라이언트가 초기화되지 않았습니다.');
        return;
    }
    
    try {
        // 로딩 표시
        showLoadingState();
        
        // Supabase에서 데이터 조회 (전체 데이터)
        const { data, error, count } = await getProperties(null, 0);
        
        if (error) {
            throw error;
        }
        
        currentProperties = data || [];
        displayProperties(currentProperties);
        
        console.log(`총 ${count}개의 매물을 불러왔습니다.`);
        
    } catch (error) {
        console.error('매물 목록 로드 오류:', error);
        showErrorState('매물 목록을 불러오는 중 오류가 발생했습니다.');
    }
}

// 매물 목록 표시
function displayProperties(properties) {
    const tableBody = document.getElementById('tableBody');
    
    if (!properties || properties.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="13" style="text-align: center; padding: 40px;">
                    등록된 매물이 없습니다.<br>
                    <button class="btn-primary" onclick="goToForm()" style="margin-top: 20px;">첫 매물 등록하기</button>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = properties.map(property => `
        <tr onclick="showPropertyDetails(${property.id})" style="cursor: pointer;">
            <td>${formatDate(property.register_date)}</td>
            <td>${property.shared === true ? '공유' : property.shared === false ? '비공유' : '-'}</td>
            <td>${property.manager || '-'}</td>
            <td><span class="status-badge ${getStatusClass(property.status)}">${property.status || '-'}</span></td>
            <td>${property.property_type || '-'}</td>
            <td>${property.trade_type || '-'}</td>
            <td>${property.price || '-'}</td>
            <td>${property.property_name || '-'}</td>
            <td>${property.floor_current || '-'}</td>
            <td>${property.ho || '-'}</td>
            <td>${property.supply_area_sqm || '-'}</td>
            <td>${property.supply_area_pyeong || '-'}</td>
            <td>${property.floor_current && property.floor_total ? `${property.floor_current}/${property.floor_total}` : '-'}</td>
        </tr>
    `).join('');
}

// 매물 상세 정보 표시
async function showPropertyDetails(propertyId) {
    try {
        const { data: property, error } = await getPropertyById(propertyId);
        
        if (error) {
            throw error;
        }
        
        if (!property) {
            alert('매물 정보를 찾을 수 없습니다.');
            return;
        }
        
        currentPropertyId = propertyId;
        
        // 데스크톱: 사이드 패널 표시
        if (window.innerWidth > 768) {
            showSidePanel(property);
        } else {
            // 모바일: 모달 표시
            showModal(property);
        }
        
    } catch (error) {
        console.error('매물 상세 조회 오류:', error);
        alert('매물 정보를 불러오는 중 오류가 발생했습니다.');
    }
}

// 사이드 패널 표시 (데스크톱)
function showSidePanel(property) {
    const sidePanel = document.getElementById('sidePanel');
    
    // 매물 정보 업데이트
    document.getElementById('sidePanelTitle').textContent = property.property_name || '매물 정보';
    document.getElementById('sideShared').textContent = property.shared === true ? '공유' : property.shared === false ? '비공유' : '-';
    document.getElementById('sideManager').textContent = property.manager || '-';
    document.getElementById('sideStatus').textContent = property.status || '-';
    document.getElementById('sideReason').textContent = property.re_register_reason || '-';
    document.getElementById('sideType').textContent = property.property_type || '-';
    document.getElementById('sideProperty').textContent = property.property_name || '-';
    document.getElementById('sideDong').textContent = property.dong || '-';
    document.getElementById('sideUnit').textContent = property.ho || '-';
    document.getElementById('sideAddress').textContent = property.address || '-';
    document.getElementById('sideTrade').textContent = property.trade_type || '-';
    document.getElementById('sidePrice').textContent = property.price || '-';
    document.getElementById('sideSupplyArea').textContent = property.supply_area_sqm || '-';
    document.getElementById('sideSupplyPyeong').textContent = property.supply_area_pyeong || '-';
    document.getElementById('sideFloorInfo').textContent = property.floor_current && property.floor_total ? 
        `${property.floor_current}/${property.floor_total}층` : '-';
    document.getElementById('sideRooms').textContent = property.rooms || '-';
    document.getElementById('sideDirection').textContent = property.direction || '-';
    document.getElementById('sideParking').textContent = property.parking || '-';
    document.getElementById('sideManagementFee').textContent = property.management_fee || '-';
    document.getElementById('sideMoveInDate').textContent = formatDate(property.move_in_date) || '-';
    document.getElementById('sideApprovalDate').textContent = formatDate(property.approval_date) || '-';
    document.getElementById('sideRegisterDate').textContent = formatDate(property.register_date) || '-';
    document.getElementById('sideMemo').textContent = property.manager_memo || '등록된 메모가 없습니다.';
    document.getElementById('sideSpecial').textContent = property.special_notes || '등록된 특이사항이 없습니다.';
    
    // 패널 표시
    sidePanel.classList.add('open');
}

// 모달 표시 (모바일)
function showModal(property) {
    const modal = document.getElementById('detailModal');
    
    // 매물 정보 업데이트
    document.getElementById('modalTitle').textContent = property.property_name || '매물 정보';
    document.getElementById('mobileShared').textContent = property.shared === true ? '공유' : property.shared === false ? '비공유' : '-';
    document.getElementById('mobileManager').textContent = property.manager || '-';
    document.getElementById('mobileStatus').textContent = property.status || '-';
    document.getElementById('mobileReason').textContent = property.re_register_reason || '-';
    document.getElementById('mobileType').textContent = property.property_type || '-';
    document.getElementById('mobileProperty').textContent = property.property_name || '-';
    document.getElementById('mobileDong').textContent = property.dong || '-';
    document.getElementById('mobileUnit').textContent = property.ho || '-';
    document.getElementById('mobileAddress').textContent = property.address || '-';
    document.getElementById('mobileDirection').textContent = property.direction || '-';
    document.getElementById('mobileRooms').textContent = property.rooms || '-';
    document.getElementById('mobileFloorInfo').textContent = property.floor_current && property.floor_total ? 
        `${property.floor_current}/${property.floor_total}층` : '-';
    document.getElementById('mobileTrade').textContent = property.trade_type || '-';
    document.getElementById('mobilePrice').textContent = property.price || '-';
    document.getElementById('mobileContractPeriod').textContent = property.contract_period || '-';
    document.getElementById('mobileCompletionDate').textContent = formatDate(property.completion_date) || '-';
    document.getElementById('mobileSupplyArea').textContent = property.supply_area_sqm || '-';
    document.getElementById('mobileSupplyPyeong').textContent = property.supply_area_pyeong || '-';
    document.getElementById('mobileMemo').textContent = property.manager_memo || '등록된 메모가 없습니다.';
    document.getElementById('mobileSpecial').textContent = property.special_notes || '등록된 특이사항이 없습니다.';
    
    // 모달 및 오버레이 표시
    modal.style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

// 사이드 패널 닫기
function closeSidePanel() {
    const sidePanel = document.getElementById('sidePanel');
    sidePanel.classList.remove('open');
    currentPropertyId = null;
}

// 모달 닫기
function closeModal() {
    document.getElementById('detailModal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
    currentPropertyId = null;
}

// 현재 매물 수정
function editCurrentProperty() {
    if (currentPropertyId) {
        window.location.href = `form.html?id=${currentPropertyId}`;
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 모달 닫기 버튼
    const closeButtons = document.querySelectorAll('.close, .close-panel');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeModal();
            closeSidePanel();
        });
    });
    
    // 오버레이 클릭 시 모달 닫기
    document.getElementById('overlay')?.addEventListener('click', closeModal);
    
    // 필터 이벤트
    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        select.addEventListener('change', applyFilters);
    });
    
    // 검색 버튼
    document.querySelector('.search-btn')?.addEventListener('click', showSearchDialog);
    
    // 정렬 버튼
    document.querySelector('.sort-btn')?.addEventListener('click', toggleSort);
}

// 필터 적용
async function applyFilters() {
    const filters = {
        property_type: document.querySelector('.filter-select:nth-child(1)')?.value,
        trade_type: document.querySelector('.filter-select:nth-child(2)')?.value,
        status: document.querySelector('.filter-select:nth-child(3)')?.value
    };
    
    // 기본값 제거
    Object.keys(filters).forEach(key => {
        if (filters[key] === '매물종류' || filters[key] === '거래유형' || filters[key] === '매물상태') {
            delete filters[key];
        }
    });
    
    try {
        const { data, error } = await getFilteredProperties(filters);
        
        if (error) {
            throw error;
        }
        
        currentProperties = data || [];
        displayProperties(currentProperties);
        
    } catch (error) {
        console.error('필터링 오류:', error);
    }
}

// 검색 다이얼로그 표시
function showSearchDialog() {
    const searchTerm = prompt('검색어를 입력하세요 (매물명, 주소):');
    
    if (searchTerm) {
        searchProperties(searchTerm);
    }
}

// 매물 검색
async function searchProperties(searchTerm) {
    try {
        const { data, error } = await getFilteredProperties({ search: searchTerm });
        
        if (error) {
            throw error;
        }
        
        currentProperties = data || [];
        displayProperties(currentProperties);
        
        if (currentProperties.length === 0) {
            alert('검색 결과가 없습니다.');
        }
        
    } catch (error) {
        console.error('검색 오류:', error);
    }
}

// 정렬 토글
function toggleSort() {
    const sortArrow = document.querySelector('.sort-arrow');
    const isAscending = sortArrow.textContent === '↑';
    
    currentProperties.sort((a, b) => {
        const dateA = new Date(a.register_date);
        const dateB = new Date(b.register_date);
        return isAscending ? dateB - dateA : dateA - dateB;
    });
    
    sortArrow.textContent = isAscending ? '↓' : '↑';
    displayProperties(currentProperties);
}

// 실시간 구독 설정
function setupRealtimeSubscription() {
    if (!window.supabaseClient) return;
    
    realtimeSubscription = subscribeToProperties((payload) => {
        console.log('실시간 변경 감지:', payload);
        
        // 변경사항에 따라 목록 업데이트
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            loadProperties();
        }
    });
}

// 페이지 언로드 시 구독 해제
window.addEventListener('beforeunload', () => {
    if (realtimeSubscription) {
        unsubscribeFromProperties(realtimeSubscription);
    }
});

// 유틸리티 함수들

// 날짜 포맷
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
}

// 상태별 클래스
function getStatusClass(status) {
    switch(status) {
        case '거래완료': return 'status-completed';
        case '거래가능': return 'status-available';
        case '매물검토': return 'status-review';
        case '매물철회': return 'status-withdrawn';
        default: return '';
    }
}

// 로딩 상태 표시
function showLoadingState() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = `
        <tr>
            <td colspan="13" style="text-align: center; padding: 40px;">
                매물 목록을 불러오는 중...
            </td>
        </tr>
    `;
}

// 에러 상태 표시
function showErrorState(message) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = `
        <tr>
            <td colspan="13" style="text-align: center; padding: 40px; color: red;">
                ${message}
            </td>
        </tr>
    `;
}