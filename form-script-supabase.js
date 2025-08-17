// 매물 등록 페이지 스크립트 (Supabase 연동)

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 대한민국 서울시 기준으로 오늘 날짜 설정
    function setSeoulDate() {
        try {
            // Method 1: Intl API 사용 (가장 정확한 방법)
            const seoulTime = new Date().toLocaleDateString('sv-SE', {
                timeZone: 'Asia/Seoul'
            });
            
            console.log('서울 시간 (Method 1):', seoulTime);
            
            const registerDateField = document.getElementById('registerDate');
            if (registerDateField) {
                registerDateField.value = seoulTime;
                console.log('등록일 설정 완료:', seoulTime);
                return;
            }
        } catch (error) {
            console.warn('Method 1 실패, Method 2 시도:', error);
        }
        
        try {
            // Method 2: 수동 계산
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const seoul = new Date(utc + (9 * 3600000));
            
            const year = seoul.getFullYear();
            const month = String(seoul.getMonth() + 1).padStart(2, '0');
            const day = String(seoul.getDate()).padStart(2, '0');
            const todayDate = `${year}-${month}-${day}`;
            
            console.log('서울 시간 (Method 2):', todayDate);
            
            const registerDateField = document.getElementById('registerDate');
            if (registerDateField) {
                registerDateField.value = todayDate;
                console.log('등록일 설정 완료 (Method 2):', todayDate);
            }
        } catch (error) {
            console.error('날짜 설정 실패:', error);
        }
    }
    
    // DOM이 완전히 로드된 후 날짜 설정
    setTimeout(() => {
        setSeoulDate();
    }, 100);
    
    // Supabase 초기화 확인
    setTimeout(() => {
        if (!window.supabaseClient) {
            alert('데이터베이스 연결 실패. Supabase 설정을 확인해주세요.');
        }
    }, 2000);
    
    // 수정 모드 확인
    checkEditMode();
    
    // 면적 자동 계산 이벤트
    setupAreaCalculators();
    
    // 사용승인일 기본값 설정 (1년 전)
    setDefaultApprovalDate();
});

// 목록으로 이동
function goToList() {
    window.location.href = 'index.html';
}

// 매물 저장 - 전역 함수로 등록
async function saveProperty() {
    // Supabase 클라이언트 확인
    if (!window.supabaseClient) {
        alert('데이터베이스 연결이 필요합니다. 잠시 후 다시 시도해주세요.');
        return;
    }

    // 폼 데이터 수집
    const formData = {
        register_date: document.getElementById('registerDate').value,
        shared: document.getElementById('shared')?.value === 'true' || false,
        manager: document.getElementById('manager').value,
        status: document.getElementById('status').value || null,
        re_register_reason: document.getElementById('reRegisterReason').value || null,
        property_type: document.getElementById('propertyType').value || null,
        property_name: document.getElementById('propertyName').value,
        dong: document.getElementById('dong')?.value || null,
        ho: document.getElementById('unit').value || null,
        address: document.getElementById('address').value || null,
        trade_type: document.getElementById('tradeType').value || null,
        price: document.getElementById('price').value || null,
        supply_area_sqm: document.getElementById('supplyArea').value || null,
        supply_area_pyeong: document.getElementById('supplyPyeong').value || null,
        floor_current: document.getElementById('floorInfo')?.value?.split('/')[0] || null,
        floor_total: document.getElementById('floorInfo')?.value?.split('/')[1] || null,
        rooms: document.getElementById('rooms').value || null,
        direction: document.getElementById('direction').value || null,
        management_fee: document.getElementById('management').value || null,
        parking: document.getElementById('parking').value || null,
        move_in_date: document.getElementById('moveInDate').value || null,
        approval_date: document.getElementById('approvalDate').value || null,
        special_notes: document.getElementById('specialNotes').value || null,
        manager_memo: document.getElementById('managerMemo')?.value || null
    };

    // 필수 항목 검증
    if (!formData.register_date) {
        alert('등록일을 입력해주세요.');
        return;
    }
    if (!formData.property_name) {
        alert('매물명을 입력해주세요.');
        return;
    }

    // 로딩 표시
    const saveButton = document.querySelector('.btn-save');
    const originalText = saveButton ? saveButton.textContent : '저장하기';
    if (saveButton) {
        saveButton.textContent = '저장 중...';
        saveButton.disabled = true;
    }

    try {
        // 수정 모드 확인
        const urlParams = new URLSearchParams(window.location.search);
        const propertyId = urlParams.get('edit') || urlParams.get('id');
        
        let data, error;
        
        if (propertyId) {
            // 수정 모드: 기존 매물 업데이트
            const result = await updateProperty(propertyId, formData);
            data = result.data;
            error = result.error;
            
            if (error) {
                throw error;
            }
            
            // 수정 완료 후 확인 시 목록으로 이동 (뒤로가기 방지)
            if (confirm('매물이 성공적으로 수정되었습니다.\n확인을 누르면 매물 목록으로 이동합니다.')) {
                window.location.replace('index.html');
            } else {
                // 취소를 눌러도 목록으로 이동 (뒤로가기 방지)
                window.location.replace('index.html');
            }
        } else {
            // 등록 모드: 새 매물 추가
            const result = await insertProperty(formData);
            data = result.data;
            error = result.error;
            
            if (error) {
                throw error;
            }
            
            // alert 확인 후 목록으로 이동 (뒤로가기 방지)
            if (confirm('매물이 성공적으로 등록되었습니다.\n확인을 누르면 매물 목록으로 이동합니다.')) {
                window.location.replace('index.html');
            } else {
                // 취소를 눌러도 목록으로 이동 (뒤로가기 방지)
                window.location.replace('index.html');
            }
        } else {
            // 수정 모드가 아닌 경우에도 동일하게 처리
            window.location.href = 'index.html';
        }
        
    } catch (error) {
        console.error('저장 오류:', error);
        const action = urlParams.get('edit') || urlParams.get('id') ? '수정' : '등록';
        alert(`매물 ${action} 중 오류가 발생했습니다: ` + error.message);
    } finally {
        // 버튼 상태 복구
        if (saveButton) {
            saveButton.textContent = originalText;
            saveButton.disabled = false;
        }
    }
}

// URL 파라미터로 수정 모드 확인
function checkEditMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('edit') || urlParams.get('id');
    
    if (propertyId) {
        // 관리자 권한 확인
        const isAdmin = sessionStorage.getItem('admin_logged_in') === 'true';
        if (!isAdmin) {
            alert('관리자만 매물을 수정할 수 있습니다.');
            window.location.href = 'index.html';
            return;
        }
        
        loadPropertyForEdit(propertyId);
        // 페이지 제목 변경
        document.querySelector('.page-title').textContent = '매물수정';
    }
}

// 수정을 위한 매물 데이터 로드
async function loadPropertyForEdit(propertyId) {
    try {
        // 먼저 로컬 데이터에서 찾기 시도
        const localData = getLocalPropertyById(propertyId);
        
        if (localData) {
            fillFormWithLocalData(localData);
            return;
        }
        
        // 로컬에서 찾지 못하면 Supabase에서 조회
        if (!window.supabaseClient) {
            setTimeout(() => loadPropertyForEdit(propertyId), 500);
            return;
        }

        const { data, error } = await getPropertyById(propertyId);
        
        if (error) {
            throw error;
        }
        
        if (data) {
            fillFormWithSupabaseData(data);
        }
        
    } catch (error) {
        console.error('매물 데이터 로드 오류:', error);
        alert('매물 데이터를 불러오는 중 오류가 발생했습니다.');
    }
}

// 로컬 데이터에서 매물 찾기
function getLocalPropertyById(id) {
    // script.js의 currentData에서 찾기
    if (window.currentData) {
        return window.currentData.find(item => item.id == id);
    }
    return null;
}

// 로컬 데이터로 폼 채우기
function fillFormWithLocalData(data) {
    document.getElementById('registerDate').value = data.date || '';
    document.getElementById('shared').checked = data.shared || false;
    document.getElementById('manager').value = data.manager || '';
    document.getElementById('status').value = data.status || '';
    document.getElementById('reRegisterReason').value = data.reason || '';
    document.getElementById('propertyType').value = data.type || '';
    document.getElementById('propertyName').value = data.property || '';
    document.getElementById('dong').value = data.floor || '';
    document.getElementById('unit').value = data.unit || '';
    document.getElementById('address').value = data.address || '';
    document.getElementById('tradeType').value = data.trade || '';
    document.getElementById('price').value = data.price || '';
    document.getElementById('supplyArea').value = data.supply || '';
    document.getElementById('supplyPyeong').value = data.pyeong || '';
    document.getElementById('floorInfo').value = data.households || '';
    document.getElementById('specialNotes').value = data.special || '';
    document.getElementById('managerMemo').value = data.memo || '';
}

// Supabase 데이터로 폼 채우기  
function fillFormWithSupabaseData(data) {
    document.getElementById('registerDate').value = data.register_date || '';
    document.getElementById('shared').checked = data.shared || false;
    document.getElementById('manager').value = data.manager || '';
    document.getElementById('status').value = data.status || '';
    document.getElementById('reRegisterReason').value = data.re_register_reason || '';
    document.getElementById('propertyType').value = data.property_type || '';
    document.getElementById('propertyName').value = data.property_name || '';
    document.getElementById('dong').value = data.dong || '';
    document.getElementById('unit').value = data.ho || '';
    document.getElementById('address').value = data.address || '';
    document.getElementById('tradeType').value = data.trade_type || '';
    document.getElementById('price').value = data.price || '';
    document.getElementById('supplyArea').value = data.supply_area_sqm || '';
    document.getElementById('supplyPyeong').value = data.supply_area_pyeong || '';
    
    if (data.floor_current && data.floor_total) {
        document.getElementById('floorInfo').value = `${data.floor_current}/${data.floor_total}`;
    } else if (data.floor_current) {
        document.getElementById('floorInfo').value = data.floor_current;
    }
    
    document.getElementById('rooms').value = data.rooms || '';
    document.getElementById('direction').value = data.direction || '';
    document.getElementById('management').value = data.management_fee || '';
    document.getElementById('parking').value = data.parking || '';
    document.getElementById('moveInDate').value = data.move_in_date || '';
    document.getElementById('approvalDate').value = data.approval_date || '';
    document.getElementById('specialNotes').value = data.special_notes || '';
    document.getElementById('managerMemo').value = data.manager_memo || '';
    
    // 버튼 텍스트 변경
    const primaryBtn = document.querySelector('.btn-save');
    if (primaryBtn) {
        primaryBtn.textContent = '수정';
    }
    
    // 저장 함수를 수정 함수로 변경
    window.saveProperty = async function() {
        await updatePropertyData(propertyId);
    };
}

// 매물 수정
async function updatePropertyData(propertyId) {
    if (!window.supabaseClient) {
        alert('데이터베이스 연결이 필요합니다.');
        return;
    }

    // 폼 데이터 수집 (saveProperty와 동일)
    const formData = {
        register_date: document.getElementById('registerDate').value,
        shared: document.getElementById('shared')?.value === 'true' || false,
        manager: document.getElementById('manager').value,
        status: document.getElementById('status').value || null,
        re_register_reason: document.getElementById('reRegisterReason').value || null,
        property_type: document.getElementById('propertyType').value || null,
        property_name: document.getElementById('propertyName').value,
        dong: document.getElementById('dong')?.value || null,
        ho: document.getElementById('unit').value || null,
        address: document.getElementById('address').value || null,
        trade_type: document.getElementById('tradeType').value || null,
        price: document.getElementById('price').value || null,
        supply_area_sqm: document.getElementById('supplyArea').value || null,
        supply_area_pyeong: document.getElementById('supplyPyeong').value || null,
        floor_current: document.getElementById('floorInfo')?.value?.split('/')[0] || null,
        floor_total: document.getElementById('floorInfo')?.value?.split('/')[1] || null,
        rooms: document.getElementById('rooms').value || null,
        direction: document.getElementById('direction').value || null,
        management_fee: document.getElementById('management').value || null,
        parking: document.getElementById('parking').value || null,
        move_in_date: document.getElementById('moveInDate').value || null,
        approval_date: document.getElementById('approvalDate').value || null,
        special_notes: document.getElementById('specialNotes').value || null,
        manager_memo: document.getElementById('managerMemo')?.value || null
    };

    const saveButton = document.querySelector('.btn-save');
    const originalText = saveButton ? saveButton.textContent : '수정';
    if (saveButton) {
        saveButton.textContent = '수정 중...';
        saveButton.disabled = true;
    }

    try {
        const { data, error } = await updateProperty(propertyId, formData);

        if (error) {
            throw error;
        }

        // 수정 완료 후 확인 시 목록으로 이동 (뒤로가기 방지)
        if (confirm('매물이 성공적으로 수정되었습니다.\n확인을 누르면 매물 목록으로 이동합니다.')) {
            window.location.replace('index.html');
        } else {
            // 취소를 눌러도 목록으로 이동 (뒤로가기 방지)
            window.location.replace('index.html');
        }
        
    } catch (error) {
        console.error('수정 오류:', error);
        alert('매물 수정 중 오류가 발생했습니다: ' + error.message);
    } finally {
        if (saveButton) {
            saveButton.textContent = originalText;
            saveButton.disabled = false;
        }
    }
}

// 면적 자동 계산 설정
function setupAreaCalculators() {
    const supplyArea = document.getElementById('supplyArea');
    const supplyPyeong = document.getElementById('supplyPyeong');
    
    if (supplyArea && supplyPyeong) {
        // ㎡ → 평 변환
        supplyArea.addEventListener('input', function(e) {
            const value = e.target.value;
            if (value && value.includes('/')) {
                const [supply, exclusive] = value.split('/');
                const supplyNum = parseFloat(supply);
                const exclusiveNum = parseFloat(exclusive);
                
                if (!isNaN(supplyNum) && !isNaN(exclusiveNum)) {
                    const supplyPy = (supplyNum * 0.3025).toFixed(2);
                    const exclusivePy = (exclusiveNum * 0.3025).toFixed(2);
                    supplyPyeong.value = `${supplyPy}/${exclusivePy}`;
                }
            } else if (value && !isNaN(value)) {
                const pyeong = (parseFloat(value) * 0.3025).toFixed(2);
                supplyPyeong.value = pyeong;
            }
        });
        
        // 평 → ㎡ 변환
        supplyPyeong.addEventListener('input', function(e) {
            const value = e.target.value;
            if (value && value.includes('/')) {
                const [supply, exclusive] = value.split('/');
                const supplyNum = parseFloat(supply);
                const exclusiveNum = parseFloat(exclusive);
                
                if (!isNaN(supplyNum) && !isNaN(exclusiveNum)) {
                    const supplySqm = (supplyNum / 0.3025).toFixed(2);
                    const exclusiveSqm = (exclusiveNum / 0.3025).toFixed(2);
                    supplyArea.value = `${supplySqm}/${exclusiveSqm}`;
                }
            } else if (value && !isNaN(value)) {
                const sqm = (parseFloat(value) / 0.3025).toFixed(2);
                supplyArea.value = sqm;
            }
        });
    }
}

// 사용승인일 기본값 설정 (1년 전)
function setDefaultApprovalDate() {
    const today = new Date();
    const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const year = lastYear.getFullYear();
    const month = String(lastYear.getMonth() + 1).padStart(2, '0');
    const day = String(lastYear.getDate()).padStart(2, '0');
    const defaultDate = `${year}-${month}-${day}`;
    
    const approvalDateInput = document.getElementById('approvalDate');
    if (approvalDateInput && !approvalDateInput.value) {
        approvalDateInput.value = defaultDate;
    }
}

// 사용승인일 연도 조정 함수
function adjustApprovalYear(yearDelta) {
    const approvalDateInput = document.getElementById('approvalDate');
    if (!approvalDateInput) return;
    
    let currentDate = approvalDateInput.value;
    if (!currentDate) {
        // 값이 없으면 기본값(1년 전) 설정
        setDefaultApprovalDate();
        currentDate = approvalDateInput.value;
    }
    
    const date = new Date(currentDate);
    if (isNaN(date.getTime())) return;
    
    date.setFullYear(date.getFullYear() + yearDelta);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const newDate = `${year}-${month}-${day}`;
    
    approvalDateInput.value = newDate;
}

// 전역 함수로 노출
window.saveProperty = saveProperty;
window.goToList = goToList;
window.adjustApprovalYear = adjustApprovalYear;