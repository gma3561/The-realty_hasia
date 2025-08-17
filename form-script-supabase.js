// 매물 등록 페이지 스크립트 (Supabase 연동)

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 오늘 날짜로 등록일 설정
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('registerDate').value = today;
    
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
});

// 목록으로 이동
function goToList() {
    window.location.href = 'index.html';
}

// 매물 저장
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
        floor_current: document.getElementById('floor').value || null,
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
    const saveButton = document.querySelector('.btn-primary');
    const originalText = saveButton.textContent;
    saveButton.textContent = '저장 중...';
    saveButton.disabled = true;

    try {
        // Supabase에 데이터 저장
        const { data, error } = await insertProperty(formData);

        if (error) {
            throw error;
        }

        alert('매물이 성공적으로 등록되었습니다.');
        
        // 목록 페이지로 이동
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('저장 오류:', error);
        alert('매물 등록 중 오류가 발생했습니다: ' + error.message);
    } finally {
        // 버튼 상태 복구
        saveButton.textContent = originalText;
        saveButton.disabled = false;
    }
}

// URL 파라미터로 수정 모드 확인
function checkEditMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id');
    
    if (propertyId) {
        loadPropertyForEdit(propertyId);
    }
}

// 수정을 위한 매물 데이터 로드
async function loadPropertyForEdit(propertyId) {
    if (!window.supabaseClient) {
        setTimeout(() => loadPropertyForEdit(propertyId), 500);
        return;
    }

    try {
        const { data, error } = await getPropertyById(propertyId);
        
        if (error) {
            throw error;
        }
        
        if (data) {
            // 폼에 데이터 채우기
            document.getElementById('registerDate').value = data.register_date || '';
            document.getElementById('shared').value = data.shared ? 'true' : 'false';
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
            document.getElementById('floor').value = data.floor_current || '';
            
            if (data.floor_current && data.floor_total) {
                document.getElementById('floorInfo').value = `${data.floor_current}/${data.floor_total}`;
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
            document.querySelector('.btn-primary').textContent = '수정';
            
            // 저장 함수를 수정 함수로 변경
            window.saveProperty = async function() {
                await updatePropertyData(propertyId);
            };
        }
    } catch (error) {
        console.error('매물 데이터 로드 오류:', error);
        alert('매물 정보를 불러오는 중 오류가 발생했습니다.');
    }
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
        floor_current: document.getElementById('floor').value || null,
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

    const saveButton = document.querySelector('.btn-primary');
    const originalText = saveButton.textContent;
    saveButton.textContent = '수정 중...';
    saveButton.disabled = true;

    try {
        const { data, error } = await updateProperty(propertyId, formData);

        if (error) {
            throw error;
        }

        alert('매물이 성공적으로 수정되었습니다.');
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('수정 오류:', error);
        alert('매물 수정 중 오류가 발생했습니다: ' + error.message);
    } finally {
        saveButton.textContent = originalText;
        saveButton.disabled = false;
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