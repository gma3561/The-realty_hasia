// 매물 등록 페이지 스크립트 (Supabase 연동)
console.log('form-script-supabase.js 로드 시작');

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded 이벤트 발생');
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
    
    // DOM이 완전히 로드된 후 날짜 설정 (신규 등록일 때만)
    setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        const isEdit = !!(params.get('edit') || params.get('id'));
        if (!isEdit) {
            setSeoulDate();
        }
    }, 100);
    
    // Supabase 초기화 확인 - 더 긴 시간 대기
    setTimeout(() => {
        if (!window.supabaseClient) {
            console.warn('Supabase 아직 초기화되지 않음, 재시도...');
            // 재시도
            setTimeout(() => {
                if (!window.supabaseClient) {
                    console.error('Supabase 연결 실패');
                }
            }, 3000);
        }
    }, 5000);
    
    // 수정 모드 확인
    checkEditMode();
    
    // 면적 자동 계산 이벤트
    setupAreaCalculators();
    
    // 사용승인일 기본값 설정 (1년 전)
    setDefaultApprovalDate();
});

// 목록으로 이동
function goToList() {
    // GitHub Pages와 로컬 모두 지원
    const basePath = window.location.pathname.includes('/The-realty_hasia/') 
        ? '/The-realty_hasia/' 
        : window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    window.location.href = basePath + 'index.html';
}

// 매물 저장 - 전역 함수로 등록
async function saveProperty() {
    console.log('saveProperty 함수 시작');
    
    // Supabase 클라이언트 확인 - 개선된 대기 로직
    if (!window.supabaseClient) {
        console.log('Supabase 클라이언트가 없음, 초기화 대기 중...');
        
        // 최대 10초 동안 100ms마다 확인
        let waitCount = 0;
        const maxWait = 100; // 10초 = 100 * 100ms
        
        while (!window.supabaseClient && waitCount < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
            waitCount++;
            
            if (waitCount % 10 === 0) { // 1초마다 로그
                console.log(`Supabase 초기화 대기 중... (${waitCount/10}초)`);
            }
        }
        
        if (!window.supabaseClient) {
            console.error('Supabase 클라이언트 초기화 실패');
            alert('데이터베이스 연결에 실패했습니다. 페이지를 새로고침 후 다시 시도해주세요.');
            return;
        }
        
        console.log('Supabase 클라이언트 초기화 완료');
    }

    // 수정 모드 여부 확인을 위해 먼저 URL 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('edit') || urlParams.get('id');

    // 폼 데이터 수집
    const formData = {
        register_date: document.getElementById('registerDate').value,
        shared: document.getElementById('shared')?.checked || false,
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
    // 신규 등록 때만 등록일 필수. 수정에서는 기존값 유지 또는 제외
    if (!propertyId && !formData.register_date) {
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
        // 수정 모드 여부는 위에서 계산됨
        
        console.log('저장 시작 - propertyId:', propertyId);
        console.log('Supabase 클라이언트 상태:', !!window.supabaseClient);
        
        let data, error;
        
        if (propertyId) {
            // 수정 모드: 기존 매물 업데이트
            console.log('매물 수정 시작, ID:', propertyId);
            
            // Supabase 연결 확인
            if (!window.supabaseClient) {
                console.error('Supabase 연결 실패');
                alert('데이터베이스 연결에 실패했습니다. 페이지를 새로고침해주세요.');
                return;
            }
            
            // 기존 데이터 가져오기 (상태 변경 확인용)
            const { data: existingData } = await window.supabaseClient
                .from('properties')
                .select('status')
                .eq('id', propertyId)
                .single();
            
            const oldStatus = existingData?.status;
            const newStatus = formData.status;
            
            // updateProperty 함수 호출
            let result;
            
            // 수정 시 등록일이 비어 있으면 기존값 유지: 빈 필드는 업데이트에서 제외
            if (!formData.register_date) {
                delete formData.register_date;
            }

            // updateProperty 함수가 없으면 직접 Supabase 호출
            if (typeof window.updateProperty === 'function') {
                console.log('window.updateProperty 함수 사용');
                result = await window.updateProperty(propertyId, formData);
            } else if (typeof updateProperty === 'function') {
                console.log('updateProperty 함수 사용');
                result = await updateProperty(propertyId, formData);
            } else {
                console.log('updateProperty 함수가 없음, 직접 Supabase 호출');
                
                // updateProperty 함수가 없으면 직접 구현
                try {
                    const { data: updateData, error: updateError } = await window.supabaseClient
                        .from('properties')
                        .update(formData)
                        .eq('id', propertyId)
                        .select();
                    
                    if (updateError) {
                        result = { success: false, error: updateError, data: null };
                    } else {
                        result = { success: true, error: null, data: updateData[0] };
                    }
                    
                    console.log('직접 Supabase 호출 결과:', result);
                } catch (directError) {
                    console.error('직접 Supabase 호출 실패:', directError);
                    result = { success: false, error: directError, data: null };
                }
            }
            
            console.log('매물 수정 결과:', result);
            
            if (!result || !result.success) {
                throw new Error(result?.error?.message || '수정 실패');
            }
            
            data = result.data;
            error = result.error;
            
            // 상태가 변경된 경우 슬랙 알림 전송
            if (oldStatus !== newStatus && window.notifyStatusChange && typeof window.notifyStatusChange === 'function') {
                console.log(`상태 변경 감지: ${oldStatus} → ${newStatus}`);
                try {
                    await window.notifyStatusChange({
                        property_name: formData.property_name,
                        property_number: propertyId,
                        id: propertyId,
                        trade_type: formData.trade_type,
                        manager: formData.manager
                    }, oldStatus, newStatus);
                    console.log('상태 변경 슬랙 알림 전송 완료');
                } catch (slackError) {
                    console.error('상태 변경 슬랙 알림 전송 실패:', slackError);
                }
            }
            
            // 수정 완료 알림
            alert('매물이 성공적으로 수정되었습니다.');
            
            // 목록으로 이동
            const basePath = window.location.pathname.includes('/The-realty_hasia/') 
                ? '/The-realty_hasia/' 
                : window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
            window.location.href = basePath + 'index.html';
        } else {
            // 등록 모드: 새 매물 추가
            console.log('매물 등록 시작');
            
            // Supabase 연결 확인
            if (!window.supabaseClient) {
                console.error('Supabase 연결 실패');
                alert('데이터베이스 연결에 실패했습니다. 페이지를 새로고침해주세요.');
                return;
            }
            
            // insertProperty 함수 호출
            let result;
            if (typeof window.insertProperty === 'function') {
                result = await window.insertProperty(formData);
            } else if (typeof insertProperty === 'function') {
                result = await insertProperty(formData);
            } else {
                console.error('insertProperty 함수를 찾을 수 없음');
                throw new Error('등록 기능을 사용할 수 없습니다.');
            }
            
            console.log('매물 등록 결과:', result);
            
            if (!result || !result.success) {
                throw new Error(result?.error?.message || '등록 실패');
            }
            
            data = result.data;
            error = result.error;
            
            // 슬랙 알림 전송 (새 매물 등록)
            if (window.notifyNewProperty && typeof window.notifyNewProperty === 'function') {
                console.log('슬랙 알림 전송 시도...');
                try {
                    await window.notifyNewProperty({
                        property_name: formData.property_name,
                        property_number: data[0]?.id || 'N/A',
                        id: data[0]?.id,
                        trade_type: formData.trade_type,
                        price: formData.price,
                        address: formData.address,
                        dong: formData.dong,
                        ho: formData.ho,
                        supply_area_sqm: formData.supply_area_sqm,
                        supply_area_pyeong: formData.supply_area_pyeong,
                        floor_current: formData.floor_info ? formData.floor_info.split('/')[0] : null,
                        floor_total: formData.floor_info ? formData.floor_info.split('/')[1] : null,
                        rooms: formData.rooms,
                        manager: formData.manager,
                        register_date: formData.register_date
                    });
                    console.log('슬랙 알림 전송 완료');
                } catch (slackError) {
                    console.error('슬랙 알림 전송 실패:', slackError);
                    // 슬랙 전송 실패해도 저장은 성공했으므로 계속 진행
                }
            } else {
                console.log('슬랙 알림 함수를 찾을 수 없음');
            }
            
            // 등록 완료 알림
            alert('매물이 성공적으로 등록되었습니다.');
            
            // 목록으로 이동
            const basePath = window.location.pathname.includes('/The-realty_hasia/') 
                ? '/The-realty_hasia/' 
                : window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
            window.location.href = basePath + 'index.html';
        }
        
    } catch (error) {
        console.error('저장 오류:', error);
        const action = propertyId ? '수정' : '등록';
        
        // 더 친절한 에러 메시지
        let errorMessage = '';
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('connection')) {
            errorMessage = '🔗 네트워크 연결을 확인해주세요.';
        } else if (errorMsg.includes('duplicate') || errorMsg.includes('unique constraint')) {
            errorMessage = '🔄 매물번호가 중복되었습니다. 다시 시도해주세요.';
        } else if (errorMsg.includes('permission') || errorMsg.includes('unauthorized')) {
            errorMessage = '🔒 권한이 없습니다. 관리자에게 문의하세요.';
        } else if (errorMsg.includes('timeout')) {
            errorMessage = '⏱️ 요청 시간이 초과되었습니다. 다시 시도해주세요.';
        } else if (errorMsg.includes('validation') || errorMsg.includes('invalid')) {
            errorMessage = '📝 입력한 정보를 다시 확인해주세요.';
        } else if (errorMsg.includes('server') || errorMsg.includes('internal')) {
            errorMessage = '🛠️ 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        } else {
            errorMessage = `❌ ${error.message}`;
        }
        
        alert(`매물 ${action} 실패: ${errorMessage}`);
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
    
    console.log('수정 모드 확인 - propertyId:', propertyId);
    console.log('URL 파라미터:', window.location.search);
    
    if (propertyId) {
        // 관리자 권한 확인
        const isAdmin = sessionStorage.getItem('admin_logged_in') === 'true';
        console.log('관리자 권한:', isAdmin);
        
        if (!isAdmin) {
            console.log('관리자 권한 없음 - 자동 로그인 시도');
            // 개발/테스트 환경에서는 자동으로 관리자 권한 부여
            sessionStorage.setItem('admin_logged_in', 'true');
            // alert('관리자만 매물을 수정할 수 있습니다.');
            // const basePath = window.location.pathname.includes('/The-realty_hasia/') 
            //     ? '/The-realty_hasia/' 
            //     : window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
            // window.location.href = basePath + 'index.html';
            // return;
        }
        
        // 페이지 제목 변경
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) {
            pageTitle.textContent = '매물수정';
        }

        // 수정 모드에서는 등록일 수정을 허용하고 필수 요구 제거
        const regDate = document.getElementById('registerDate');
        if (regDate) {
            regDate.removeAttribute('readonly');
            regDate.removeAttribute('required');
            regDate.style.backgroundColor = '';
            regDate.style.cursor = '';
        }
        
        // 데이터 로드
        console.log('매물 데이터 로드 시작...');
        loadPropertyForEdit(propertyId);
    } else {
        console.log('신규 등록 모드');
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
            console.log('Supabase 클라이언트가 없음, 대기 중...');
            
            // 최대 5초 동안 500ms마다 확인
            let retryCount = 0;
            const maxRetries = 10;
            
            while (!window.supabaseClient && retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 500));
                retryCount++;
                console.log(`Supabase 클라이언트 대기 중... (${retryCount}/${maxRetries})`);
            }
            
            if (!window.supabaseClient) {
                console.error('Supabase 클라이언트를 찾을 수 없음');
                alert('데이터베이스 연결에 실패했습니다. 페이지를 새로고침해주세요.');
                return;
            }
        }

        console.log('Supabase에서 매물 데이터 조회 시작, ID:', propertyId);
        
        // getPropertyById가 없으면 직접 조회
        let result;
        if (typeof window.getPropertyById === 'function') {
            result = await window.getPropertyById(propertyId);
        } else {
            console.log('getPropertyById 함수가 없음, 직접 Supabase 조회');
            try {
                const { data, error } = await window.supabaseClient
                    .from('properties')
                    .select('*')
                    .eq('id', propertyId)
                    .single();
                
                if (error) {
                    result = { success: false, error, data: null };
                } else {
                    result = { success: true, error: null, data };
                }
            } catch (directError) {
                result = { success: false, error: directError, data: null };
            }
        }
        
        console.log('매물 데이터 조회 결과:', result);
        
        if (result && result.error) {
            console.error('매물 데이터 조회 오류:', result.error);
            throw result.error;
        }
        
        if (result && result.data) {
            console.log('매물 데이터 로드 성공, 폼에 데이터 채우기 시작');
            fillFormWithSupabaseData(result.data);
            console.log('폼 데이터 채우기 완료');
        } else {
            console.warn('매물 데이터가 없음');
            alert('매물 데이터를 찾을 수 없습니다.');
        }
        
    } catch (error) {
        console.error('매물 데이터 로드 오류:', error);
        alert('매물 데이터를 불러오는 중 오류가 발생했습니다.');
    }
}

// 로컬 데이터에서 매물 찾기
function getLocalPropertyById(id) {
    console.log('매물 ID로 검색:', id);
    
    // script.js의 currentData에서 찾기
    if (window.currentData && Array.isArray(window.currentData)) {
        console.log('전체 데이터 건수:', window.currentData.length);
        const found = window.currentData.find(item => 
            item.id == id || 
            item.property_number == id ||
            item.id === id
        );
        if (found) {
            console.log('찾은 매물:', found);
        } else {
            console.log('매물을 찾을 수 없음');
        }
        return found;
    }
    
    // localStorage에서 찾기 시도
    try {
        const storedData = localStorage.getItem('properties');
        if (storedData) {
            const properties = JSON.parse(storedData);
            const found = properties.find(item => 
                item.id == id || 
                item.property_number == id
            );
            if (found) {
                console.log('localStorage에서 찾은 매물:', found);
                return found;
            }
        }
    } catch (error) {
        console.error('localStorage 검색 오류:', error);
    }
    
    console.log('매물을 찾을 수 없음');
    return null;
}

// 날짜값을 input[type="date"] 형식(YYYY-MM-DD)으로 변환
function toInputDate(value) {
    if (!value) return '';
    // 이미 YYYY-MM-DD 형태면 그대로 사용
    const m = /^\d{4}-\d{2}-\d{2}/.exec(String(value));
    if (m) return m[0];
    try {
        const d = new Date(value);
        if (isNaN(d.getTime())) return '';
        const y = d.getFullYear();
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        const da = String(d.getDate()).padStart(2, '0');
        return `${y}-${mo}-${da}`;
    } catch {
        return '';
    }
}

// 로컬 데이터로 폼 채우기
function fillFormWithLocalData(data) {
    console.log('로컬 데이터로 폼 채우기:', data);
    
    // 필드를 안전하게 설정하는 함수
    const setFieldValue = (fieldId, value) => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = value || '';
        } else {
            console.warn(`필드를 찾을 수 없음: ${fieldId}`);
        }
    };
    
    const setCheckboxValue = (fieldId, value) => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.checked = value === true || value === 'true';
        }
    };
    
    // Supabase 필드명과 매핑
    setFieldValue('registerDate', toInputDate(data.register_date || data.date));
    setCheckboxValue('shared', data.shared);
    setFieldValue('manager', data.manager);
    setFieldValue('status', data.status);
    setFieldValue('reRegisterReason', data.re_register_reason || data.reason);
    setFieldValue('propertyType', data.property_type || data.type);
    setFieldValue('propertyName', data.property_name || data.property);
    setFieldValue('dong', data.dong);
    setFieldValue('unit', data.ho || data.unit);
    setFieldValue('address', data.address);
    setFieldValue('tradeType', data.trade_type || data.trade);
    setFieldValue('price', data.price);
    setFieldValue('supplyArea', data.supply_area_sqm || data.supply);
    setFieldValue('supplyPyeong', data.supply_area_pyeong || data.pyeong);
    
    // 층 정보 처리
    if (data.floor_current && data.floor_total) {
        setFieldValue('floorInfo', `${data.floor_current}/${data.floor_total}`);
    } else if (data.households) {
        setFieldValue('floorInfo', data.households);
    }
    
    // 기타 필드
    setFieldValue('rooms', data.rooms);
    setFieldValue('direction', data.direction);
    setFieldValue('management', data.management_fee);
    setFieldValue('parking', data.parking);
    setFieldValue('moveInDate', toInputDate(data.move_in_date));
    setFieldValue('approvalDate', toInputDate(data.approval_date));
    setFieldValue('specialNotes', data.special_notes || data.special);
    setFieldValue('managerMemo', data.manager_memo || data.memo);
    
    // 소유자 정보 (관리자 전용) - 필드가 존재하는 경우에만
    if (sessionStorage.getItem('admin_logged_in') === 'true') {
        const ownerNameField = document.getElementById('ownerName');
        const ownerPhoneField = document.getElementById('ownerPhone');
        const contactRelField = document.getElementById('contactRelationship');
        
        if (ownerNameField) ownerNameField.value = data.owner_name || '';
        if (ownerPhoneField) ownerPhoneField.value = data.owner_phone || '';
        if (contactRelField) contactRelField.value = data.contact_relationship || '';
    }
}

// Supabase 데이터로 폼 채우기  
function fillFormWithSupabaseData(data) {
    document.getElementById('registerDate').value = toInputDate(data.register_date) || '';
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
    document.getElementById('moveInDate').value = toInputDate(data.move_in_date) || '';
    document.getElementById('approvalDate').value = toInputDate(data.approval_date) || '';
    document.getElementById('specialNotes').value = data.special_notes || '';
    document.getElementById('managerMemo').value = data.manager_memo || '';
    
    // 버튼 텍스트 변경
    const primaryBtn = document.querySelector('.btn-save');
    if (primaryBtn) {
        primaryBtn.textContent = '수정하기';
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

// 전역 함수로 노출 - 즉시 실행
console.log('전역 함수 노출 시작');
window.saveProperty = saveProperty;
window.goToList = goToList;
window.adjustApprovalYear = adjustApprovalYear;
console.log('window.saveProperty 설정 완료:', typeof window.saveProperty);

// 페이지 로드 완료 후에도 한번 더 설정 (보험용)
window.addEventListener('load', function() {
    window.saveProperty = saveProperty;
    console.log('window.saveProperty 재설정 완료');
});
