// 관리자 로그인 관련 변수
let headerClickCount = 0;
let headerClickTimer = null;

// 팀매물장 헤더 클릭 핸들러
function handleHeaderClick() {
    headerClickCount++;
    
    // 5초 내에 5번 클릭하지 않으면 카운터 리셋
    if (headerClickTimer) {
        clearTimeout(headerClickTimer);
    }
    headerClickTimer = setTimeout(() => {
        headerClickCount = 0;
    }, 5000);
    
    // 5번 클릭 시 관리자 로그인 페이지로 이동
    if (headerClickCount >= 5) {
        headerClickCount = 0;
        window.location.href = "admin-login.html";
    }
}

// 관리자 로그인 상태 확인
function isAdminLoggedIn() {
    // 두 가지 키 모두 확인 (호환성 유지)
    return sessionStorage.getItem('admin_logged_in') === 'true' || 
           sessionStorage.getItem('adminAuthenticated') === 'true';
}

// 관리자 로그아웃
function adminLogout() {
    sessionStorage.removeItem('admin_logged_in');
    location.reload();
}

// 매물등록 페이지로 이동
function goToForm() {
    window.location.href = "form.html";
}

// 매물 편집 페이지로 이동
function editProperty(id) {
    console.log('editProperty 호출, ID:', id);
    // 관리자 권한 확인
    if (!isAdminLoggedIn()) {
        alert('관리자만 매물을 수정할 수 있습니다.');
        return;
    }
    
    // GitHub Pages와 로컬 모두 지원하는 경로 설정
    const basePath = window.location.pathname.includes('/The-realty_hasia/') 
        ? '/The-realty_hasia/' 
        : window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    
    // form.html은 'id' 파라미터를 사용함
    const targetUrl = `${basePath}form.html?id=${id}`;
    console.log('관리자 권한 확인됨, 페이지 이동:', targetUrl);
    
    // 즉시 페이지 이동 - 더 강력한 방법 사용
    console.log('페이지 이동 시도 1: location.href');
    window.location.href = targetUrl;
    
    // 백업: 100ms 후 다시 시도
    setTimeout(() => {
        if (window.location.href.includes('index.html')) {
            console.log('페이지 이동 시도 2: location.assign');
            try {
                window.location.assign(targetUrl);
            } catch (e) {
                console.log('페이지 이동 시도 3: top.location');
                try {
                    window.top.location = targetUrl;
                } catch (e2) {
                    console.log('페이지 이동 시도 4: 강제 리로드');
                    window.location = window.location.origin + '/' + targetUrl;
                }
            }
        }
    }, 100);
    
    // 최종 백업: 500ms 후에도 안되면 강제 방법
    setTimeout(() => {
        if (window.location.href.includes('index.html')) {
            console.log('최후의 수단: form submit');
            const form = document.createElement('form');
            form.method = 'GET';
            form.action = 'form.html';
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'id';
            input.value = id;
            form.appendChild(input);
            document.body.appendChild(form);
            form.submit();
        }
    }, 500);
}

// 매물 삭제 (상태값만 변경)
function deleteProperty(id) {
    // 사이드패널이 열려있으면 닫기
    const sidePanel = document.getElementById('sidePanel');
    if (sidePanel && sidePanel.classList.contains('show')) {
        closeSidePanel();
    }
    
    // 관리자 권한 확인
    if (!isAdminLoggedIn()) {
        alert('관리자만 매물을 삭제할 수 있습니다.');
        return;
    }
    
    // 삭제할 매물 정보 찾기
    const property = currentData.find(item => item.id == id);
    if (!property) {
        alert('매물을 찾을 수 없습니다.');
        return;
    }
    
    // 삭제 확인 팝업
    if (confirm(`"${property.property || '매물'}"을(를) 삭제하시겠습니까?\n삭제된 매물은 목록에서 숨겨집니다.`)) {
        console.log('삭제 확인됨, 매물 ID:', id);
        console.log('삭제 전 currentData 길이:', currentData.length);
        
        // 로컬 데이터에서 해당 항목의 상태를 '삭제됨'으로 변경
        const targetProperty = currentData.find(item => item.id == id);
        if (targetProperty) {
            targetProperty.status = '삭제됨';
            console.log('매물 상태 변경 완료:', targetProperty.property);
        } else {
            console.error('삭제할 매물을 찾을 수 없음:', id);
        }
        
        // 삭제되지 않은 데이터만 필터링
        const newFilteredData = currentData.filter(item => item.status !== '삭제됨');
        console.log('필터링 후 데이터 길이:', newFilteredData.length);
        
        // 전역 변수 업데이트
        filteredData = newFilteredData;
        
        // 테이블 강제 재렌더링
        try {
            renderTable(newFilteredData);
            console.log('테이블 재렌더링 완료');
        } catch (renderError) {
            console.error('테이블 렌더링 오류:', renderError);
        }
        
        // 성공 메시지
        alert('매물이 삭제되었습니다.');
        
        // Supabase 업데이트 (백그라운드에서)
        if (window.supabaseClient) {
            console.log('Supabase deleteProperty 호출 시작:', id);
            // script-supabase.js의 deleteProperty 함수 직접 호출
            const supabaseDeleteProperty = async (id) => {
                try {
                    const { data, error } = await window.supabaseClient
                        .from('properties')
                        .update({ 
                            status: '삭제됨',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', id);
                        
                    if (error) throw error;
                    return { success: true, data };
                } catch (error) {
                    console.error('Supabase 삭제 오류:', error);
                    throw error;
                }
            };
            
            supabaseDeleteProperty(id).then(result => {
                console.log('Supabase deleteProperty 결과:', result);
            }).catch(error => {
                console.error('Supabase 삭제 오류:', error);
            });
        }
    }
}

// 삭제 확인 모달 표시
function showDeleteConfirmModal(propertyName, onConfirm) {
    const modalHtml = `
        <div id="deleteConfirmModal" class="modal" style="display: flex;">
            <div class="modal-content" style="max-width: 400px; margin: 20% auto;">
                <div class="modal-header" style="background: #fee2e2; border-bottom: 1px solid #fecaca;">
                    <h2 style="color: #991b1b; margin: 0;">매물 삭제 확인</h2>
                </div>
                <div class="modal-body" style="padding: 24px; text-align: center;">
                    <div style="margin-bottom: 16px;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" style="margin: 0 auto 16px auto; display: block;">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                    </div>
                    <p style="font-size: 16px; color: #374151; margin-bottom: 8px;">
                        <strong>"${propertyName}"</strong>을(를) 삭제하시겠습니까?
                    </p>
                    <p style="font-size: 14px; color: #6b7280;">
                        삭제된 매물은 목록에서 숨겨집니다.
                    </p>
                </div>
                <div class="modal-actions" style="display: flex; gap: 12px; padding: 16px 24px; border-top: 1px solid #e5e7eb;">
                    <button class="btn-secondary" onclick="closeDeleteConfirmModal()" style="flex: 1;">취소</button>
                    <button class="btn-danger" onclick="confirmDelete()" style="flex: 1; background: #dc2626; color: white; border-color: #dc2626;">삭제</button>
                </div>
            </div>
        </div>
    `;
    
    // 기존 모달이 있으면 제거
    const existingModal = document.getElementById('deleteConfirmModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 새 모달 추가
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // 확인 함수 저장
    window.pendingDeleteAction = onConfirm;
}

// 삭제 확인 모달 닫기
function closeDeleteConfirmModal() {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.remove();
    }
    window.pendingDeleteAction = null;
}

// 삭제 확인 실행
function confirmDelete() {
    if (window.pendingDeleteAction) {
        window.pendingDeleteAction();
    }
    closeDeleteConfirmModal();
}

// 실제 데이터는 Supabase에서 로드됨
// 더미 데이터는 더 이상 사용하지 않음
const sampleData = []; 

// 주석 처리된 더미 데이터 (백업용)
/*
const oldSampleData = [
    {
        id: 1,
        date: "2025-01-31",
        shared: false,
        manager: "정윤식",
        status: "거래철회",
        type: "오피스텔",
        trade: "월세/렌트",
        price: "4억/226",
        property: "래미안강남",
        floor: "22동",
        unit: "208",
        supply: "173/67",
        pyeong: "39/34",
        households: "24/42",
        address: "서초동 303-48",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태",
        owner: "김영희",
        ownerContact: "010-1234-5678",
        contactRelation: "본인",
        moveInDate: "2025-03-01",
        approvalDate: "2022-05-15",
        management: "20만원",
        parking: "1대",
        direction: "남향",
        rooms: "3/2"
    },
    {
        date: "2024-09-07",
        shared: false,
        manager: "정서연",
        status: "거래완료",
        type: "오피스텔",
        trade: "매매",
        price: "46억",
        property: "래미안송파",
        floor: "3동",
        unit: "1774",
        supply: "172/49",
        pyeong: "23/50",
        households: "20/42",
        address: "강남동 657-77",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-05-07",
        shared: false,
        manager: "박소현",
        status: "거래철회",
        type: "오피스텔",
        trade: "전세",
        price: "9억",
        property: "래미안용산",
        floor: "24동",
        unit: "1714",
        supply: "84/95",
        pyeong: "54/31",
        households: "3/28",
        address: "서초동 932-72",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-02-20",
        shared: true,
        manager: "박소현",
        status: "거래보류",
        type: "아파트",
        trade: "전세",
        price: "18억",
        property: "래미안강남",
        floor: "35동",
        unit: "1858",
        supply: "186/45",
        pyeong: "59/30",
        households: "40/24",
        address: "강남동 506-23",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-06-13",
        shared: false,
        manager: "송영주",
        status: "거래가능",
        type: "빌라/연립",
        trade: "매매",
        price: "24억",
        property: "래미안강남",
        floor: "46동",
        unit: "739",
        supply: "80/99",
        pyeong: "44/20",
        households: "32/50",
        address: "서초동 903-33",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-07-30",
        shared: false,
        manager: "김규민",
        status: "거래철회",
        type: "아파트",
        trade: "월세/렌트",
        price: "5억/422",
        property: "래미안서초",
        floor: "24동",
        unit: "1418",
        supply: "122/141",
        pyeong: "16/26",
        households: "14/45",
        address: "강남동 731-77",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-11-11",
        shared: false,
        manager: "정윤식",
        status: "거래철회",
        type: "아파트",
        trade: "전세",
        price: "24억",
        property: "래미안강남",
        floor: "26동",
        unit: "1066",
        supply: "188/123",
        pyeong: "37/12",
        households: "23/40",
        address: "강남동 325-59",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-09-15",
        shared: true,
        manager: "정서연",
        status: "거래철회",
        type: "주상복합",
        trade: "전세",
        price: "4억",
        property: "래미안서초",
        floor: "22동",
        unit: "1281",
        supply: "172/106",
        pyeong: "19/19",
        households: "41/34",
        address: "마포동 889-93",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-01-12",
        shared: true,
        manager: "정연서",
        status: "거래가능",
        type: "아파트",
        trade: "매매",
        price: "32억",
        property: "래미안강남",
        floor: "24동",
        unit: "683",
        supply: "136/124",
        pyeong: "26/13",
        households: "18/11",
        address: "서초동 528-17",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-09-11",
        shared: true,
        manager: "정윤식",
        status: "거래완료",
        type: "빌라/연립",
        trade: "매매",
        price: "46억",
        property: "래미안송파",
        floor: "26동",
        unit: "805",
        supply: "192/111",
        pyeong: "51/48",
        households: "7/39",
        address: "마포동 805-72",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-11-23",
        shared: false,
        manager: "송영주",
        status: "거래철회",
        type: "주상복합",
        trade: "전세",
        price: "30억",
        property: "래미안용산",
        floor: "3동",
        unit: "1197",
        supply: "127/113",
        pyeong: "20/20",
        households: "47/40",
        address: "서초동 911-73",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-11-18",
        shared: true,
        manager: "김규민",
        status: "거래보류",
        type: "아파트",
        trade: "단기",
        price: "7억/233",
        property: "래미안강남",
        floor: "36동",
        unit: "114",
        supply: "158/56",
        pyeong: "42/29",
        households: "9/35",
        address: "마포동 454-82",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-01-17",
        shared: true,
        manager: "김규민",
        status: "거래완료",
        type: "아파트",
        trade: "단기",
        price: "10억/277",
        property: "래미안마포",
        floor: "23동",
        unit: "408",
        supply: "171/56",
        pyeong: "20/34",
        households: "21/27",
        address: "송파동 608-9",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-05-06",
        shared: true,
        manager: "정연서",
        status: "거래완료",
        type: "주상복합",
        trade: "전세",
        price: "5억",
        property: "래미안용산",
        floor: "46동",
        unit: "1125",
        supply: "165/153",
        pyeong: "52/35",
        households: "21/38",
        address: "용산동 38-20",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-12-22",
        shared: true,
        manager: "정연서",
        status: "거래보류",
        type: "주상복합",
        trade: "월세/렌트",
        price: "8억/426",
        property: "래미안서초",
        floor: "11동",
        unit: "467",
        supply: "119/42",
        pyeong: "36/15",
        households: "14/12",
        address: "송파동 640-25",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-05-10",
        shared: false,
        manager: "정윤식",
        status: "거래가능",
        type: "오피스텔",
        trade: "매매",
        price: "29억",
        property: "래미안마포",
        floor: "44동",
        unit: "464",
        supply: "192/118",
        pyeong: "59/26",
        households: "1/20",
        address: "용산동 417-82",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-06-23",
        shared: true,
        manager: "박소현",
        status: "거래보류",
        type: "아파트",
        trade: "매매",
        price: "44억",
        property: "래미안마포",
        floor: "2동",
        unit: "793",
        supply: "118/108",
        pyeong: "21/45",
        households: "2/20",
        address: "마포동 470-74",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-12-19",
        shared: true,
        manager: "송영주",
        status: "거래보류",
        type: "오피스텔",
        trade: "전세",
        price: "20억",
        property: "래미안마포",
        floor: "18동",
        unit: "1561",
        supply: "89/45",
        pyeong: "19/53",
        households: "7/41",
        address: "서초동 883-60",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-09-11",
        shared: true,
        manager: "정윤식",
        status: "거래가능",
        type: "빌라/연립",
        trade: "단기",
        price: "10억/310",
        property: "래미안서초",
        floor: "29동",
        unit: "1644",
        supply: "171/139",
        pyeong: "34/47",
        households: "21/18",
        address: "서초동 60-24",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-04-06",
        shared: false,
        manager: "정서연",
        status: "거래가능",
        type: "빌라/연립",
        trade: "전세",
        price: "28억",
        property: "래미안강남",
        floor: "28동",
        unit: "205",
        supply: "53/85",
        pyeong: "23/34",
        households: "26/35",
        address: "강남동 218-98",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-12-03",
        shared: true,
        manager: "정서연",
        status: "거래완료",
        type: "주상복합",
        trade: "단기",
        price: "3억/388",
        property: "래미안강남",
        floor: "27동",
        unit: "238",
        supply: "177/155",
        pyeong: "17/18",
        households: "23/38",
        address: "강남동 826-99",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-10-18",
        shared: true,
        manager: "박소현",
        status: "거래완료",
        type: "오피스텔",
        trade: "매매",
        price: "31억",
        property: "래미안용산",
        floor: "21동",
        unit: "260",
        supply: "81/130",
        pyeong: "15/50",
        households: "23/32",
        address: "마포동 970-82",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-04-24",
        shared: true,
        manager: "박소현",
        status: "거래보류",
        type: "주상복합",
        trade: "단기",
        price: "7억/363",
        property: "래미안서초",
        floor: "20동",
        unit: "1069",
        supply: "64/177",
        pyeong: "16/28",
        households: "20/42",
        address: "강남동 621-53",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-03-20",
        shared: true,
        manager: "정서연",
        status: "거래가능",
        type: "아파트",
        trade: "매매",
        price: "28억",
        property: "래미안용산",
        floor: "16동",
        unit: "819",
        supply: "191/169",
        pyeong: "55/44",
        households: "38/18",
        address: "강남동 843-66",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-02-18",
        shared: false,
        manager: "박소현",
        status: "거래보류",
        type: "오피스텔",
        trade: "단기",
        price: "4억/401",
        property: "래미안마포",
        floor: "49동",
        unit: "714",
        supply: "138/93",
        pyeong: "16/26",
        households: "41/31",
        address: "송파동 492-53",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-10-04",
        shared: false,
        manager: "송영주",
        status: "거래가능",
        type: "오피스텔",
        trade: "매매",
        price: "46억",
        property: "래미안서초",
        floor: "37동",
        unit: "1303",
        supply: "119/49",
        pyeong: "28/50",
        households: "50/47",
        address: "강남동 311-3",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-01-27",
        shared: false,
        manager: "정연서",
        status: "거래철회",
        type: "오피스텔",
        trade: "단기",
        price: "2억/318",
        property: "래미안강남",
        floor: "23동",
        unit: "1072",
        supply: "132/91",
        pyeong: "41/25",
        households: "2/41",
        address: "강남동 817-47",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-06-16",
        shared: true,
        manager: "정선혜",
        status: "거래가능",
        type: "아파트",
        trade: "전세",
        price: "8억",
        property: "래미안강남",
        floor: "13동",
        unit: "1288",
        supply: "164/124",
        pyeong: "51/36",
        households: "19/38",
        address: "마포동 492-75",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-04-17",
        shared: true,
        manager: "하상현",
        status: "거래철회",
        type: "빌라/연립",
        trade: "단기",
        price: "2억/473",
        property: "래미안서초",
        floor: "25동",
        unit: "405",
        supply: "144/134",
        pyeong: "41/24",
        households: "40/45",
        address: "강남동 327-63",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-06-27",
        shared: false,
        manager: "송영주",
        status: "거래완료",
        type: "빌라/연립",
        trade: "매매",
        price: "41억",
        property: "래미안서초",
        floor: "43동",
        unit: "1988",
        supply: "114/126",
        pyeong: "39/23",
        households: "12/47",
        address: "용산동 681-9",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-08-24",
        shared: false,
        manager: "정서연",
        status: "거래가능",
        type: "빌라/연립",
        trade: "단기",
        price: "8억/431",
        property: "래미안서초",
        floor: "3동",
        unit: "1207",
        supply: "173/47",
        pyeong: "42/23",
        households: "14/42",
        address: "서초동 321-41",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-03-18",
        shared: false,
        manager: "송영주",
        status: "거래철회",
        type: "아파트",
        trade: "전세",
        price: "16억",
        property: "래미안강남",
        floor: "15동",
        unit: "1630",
        supply: "129/79",
        pyeong: "38/53",
        households: "12/22",
        address: "마포동 622-2",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-03-31",
        shared: false,
        manager: "정연서",
        status: "거래철회",
        type: "주상복합",
        trade: "월세/렌트",
        price: "7억/462",
        property: "래미안서초",
        floor: "13동",
        unit: "1179",
        supply: "181/174",
        pyeong: "46/40",
        households: "5/13",
        address: "서초동 138-20",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-09-23",
        shared: true,
        manager: "하상현",
        status: "거래보류",
        type: "오피스텔",
        trade: "월세/렌트",
        price: "3억/147",
        property: "래미안송파",
        floor: "18동",
        unit: "114",
        supply: "142/95",
        pyeong: "18/29",
        households: "16/37",
        address: "서초동 569-57",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-02-03",
        shared: true,
        manager: "정윤식",
        status: "거래보류",
        type: "주상복합",
        trade: "단기",
        price: "5억/111",
        property: "래미안서초",
        floor: "36동",
        unit: "1589",
        supply: "93/146",
        pyeong: "40/36",
        households: "15/22",
        address: "송파동 205-57",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-08-23",
        shared: true,
        manager: "정서연",
        status: "거래보류",
        type: "빌라/연립",
        trade: "단기",
        price: "7억/147",
        property: "래미안마포",
        floor: "42동",
        unit: "1536",
        supply: "89/163",
        pyeong: "16/42",
        households: "17/33",
        address: "마포동 911-40",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-09-15",
        shared: false,
        manager: "정연서",
        status: "거래완료",
        type: "주상복합",
        trade: "단기",
        price: "4억/486",
        property: "래미안송파",
        floor: "17동",
        unit: "247",
        supply: "184/112",
        pyeong: "21/15",
        households: "1/25",
        address: "송파동 978-49",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-08-13",
        shared: true,
        manager: "정선혜",
        status: "거래가능",
        type: "아파트",
        trade: "단기",
        price: "1억/101",
        property: "래미안서초",
        floor: "8동",
        unit: "625",
        supply: "182/161",
        pyeong: "31/50",
        households: "37/42",
        address: "강남동 983-33",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-01-28",
        shared: true,
        manager: "정선혜",
        status: "거래철회",
        type: "아파트",
        trade: "월세/렌트",
        price: "10억/120",
        property: "래미안강남",
        floor: "16동",
        unit: "1201",
        supply: "103/144",
        pyeong: "42/34",
        households: "5/26",
        address: "용산동 943-77",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-04-19",
        shared: false,
        manager: "정연서",
        status: "거래완료",
        type: "오피스텔",
        trade: "전세",
        price: "6억",
        property: "래미안강남",
        floor: "1동",
        unit: "1356",
        supply: "178/42",
        pyeong: "42/26",
        households: "17/34",
        address: "용산동 751-37",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-03-22",
        shared: true,
        manager: "정연서",
        status: "거래보류",
        type: "주상복합",
        trade: "전세",
        price: "19억",
        property: "래미안마포",
        floor: "37동",
        unit: "224",
        supply: "107/72",
        pyeong: "29/50",
        households: "24/25",
        address: "마포동 653-70",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-09-07",
        shared: false,
        manager: "박소현",
        status: "거래철회",
        type: "오피스텔",
        trade: "단기",
        price: "4억/206",
        property: "래미안용산",
        floor: "17동",
        unit: "976",
        supply: "146/165",
        pyeong: "59/47",
        households: "25/22",
        address: "용산동 755-35",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-12-17",
        shared: true,
        manager: "김규민",
        status: "거래보류",
        type: "빌라/연립",
        trade: "단기",
        price: "8억/113",
        property: "래미안강남",
        floor: "30동",
        unit: "369",
        supply: "108/161",
        pyeong: "44/40",
        households: "11/20",
        address: "강남동 478-47",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-03-07",
        shared: true,
        manager: "정연서",
        status: "거래가능",
        type: "빌라/연립",
        trade: "매매",
        price: "39억",
        property: "래미안용산",
        floor: "5동",
        unit: "692",
        supply: "91/135",
        pyeong: "23/13",
        households: "4/26",
        address: "송파동 512-62",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-08-01",
        shared: false,
        manager: "김규민",
        status: "거래가능",
        type: "아파트",
        trade: "매매",
        price: "49억",
        property: "래미안송파",
        floor: "33동",
        unit: "1264",
        supply: "124/75",
        pyeong: "17/47",
        households: "31/50",
        address: "용산동 878-67",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-02-23",
        shared: true,
        manager: "하상현",
        status: "거래철회",
        type: "오피스텔",
        trade: "단기",
        price: "8억/232",
        property: "래미안서초",
        floor: "30동",
        unit: "816",
        supply: "97/67",
        pyeong: "29/25",
        households: "24/41",
        address: "강남동 323-89",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-09-30",
        shared: false,
        manager: "정서연",
        status: "거래철회",
        type: "빌라/연립",
        trade: "월세/렌트",
        price: "4억/477",
        property: "래미안마포",
        floor: "48동",
        unit: "1481",
        supply: "129/99",
        pyeong: "36/25",
        households: "8/49",
        address: "마포동 305-83",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-06-27",
        shared: true,
        manager: "하상현",
        status: "거래가능",
        type: "빌라/연립",
        trade: "전세",
        price: "7억",
        property: "래미안송파",
        floor: "34동",
        unit: "1818",
        supply: "56/91",
        pyeong: "46/42",
        households: "25/19",
        address: "송파동 689-81",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-04-02",
        shared: false,
        manager: "송영주",
        status: "거래가능",
        type: "아파트",
        trade: "전세",
        price: "16억",
        property: "래미안마포",
        floor: "5동",
        unit: "1176",
        supply: "157/175",
        pyeong: "60/30",
        households: "30/21",
        address: "서초동 660-79",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-04-15",
        shared: true,
        manager: "정서연",
        status: "거래철회",
        type: "주상복합",
        trade: "단기",
        price: "9억/290",
        property: "래미안송파",
        floor: "32동",
        unit: "960",
        supply: "194/93",
        pyeong: "56/23",
        households: "23/20",
        address: "용산동 909-64",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-08-31",
        shared: true,
        manager: "정연서",
        status: "거래보류",
        type: "오피스텔",
        trade: "전세",
        price: "5억",
        property: "래미안마포",
        floor: "19동",
        unit: "1638",
        supply: "182/47",
        pyeong: "54/51",
        households: "7/50",
        address: "송파동 483-25",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-08-01",
        shared: false,
        manager: "정선혜",
        status: "거래보류",
        type: "빌라/연립",
        trade: "전세",
        price: "4억",
        property: "래미안용산",
        floor: "18동",
        unit: "338",
        supply: "180/51",
        pyeong: "43/51",
        households: "37/44",
        address: "용산동 446-9",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-07-26",
        shared: false,
        manager: "박소현",
        status: "거래보류",
        type: "오피스텔",
        trade: "전세",
        price: "13억",
        property: "래미안용산",
        floor: "37동",
        unit: "1255",
        supply: "76/118",
        pyeong: "58/41",
        households: "39/34",
        address: "용산동 768-54",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-07-04",
        shared: true,
        manager: "박소현",
        status: "거래완료",
        type: "빌라/연립",
        trade: "매매",
        price: "28억",
        property: "래미안용산",
        floor: "31동",
        unit: "270",
        supply: "165/161",
        pyeong: "60/39",
        households: "42/43",
        address: "용산동 214-18",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-02-06",
        shared: false,
        manager: "송영주",
        status: "거래가능",
        type: "빌라/연립",
        trade: "전세",
        price: "12억",
        property: "래미안서초",
        floor: "6동",
        unit: "411",
        supply: "172/59",
        pyeong: "36/17",
        households: "14/18",
        address: "용산동 162-70",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-10-29",
        shared: true,
        manager: "김규민",
        status: "거래보류",
        type: "빌라/연립",
        trade: "월세/렌트",
        price: "7억/389",
        property: "래미안마포",
        floor: "31동",
        unit: "1070",
        supply: "111/163",
        pyeong: "42/37",
        households: "49/27",
        address: "마포동 530-74",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-08-12",
        shared: true,
        manager: "하상현",
        status: "거래가능",
        type: "주상복합",
        trade: "단기",
        price: "10억/496",
        property: "래미안서초",
        floor: "25동",
        unit: "811",
        supply: "193/42",
        pyeong: "19/32",
        households: "8/23",
        address: "송파동 130-27",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-01-19",
        shared: false,
        manager: "하상현",
        status: "거래가능",
        type: "아파트",
        trade: "월세/렌트",
        price: "4억/482",
        property: "래미안용산",
        floor: "21동",
        unit: "1822",
        supply: "176/88",
        pyeong: "16/21",
        households: "25/49",
        address: "송파동 678-50",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-12-02",
        shared: true,
        manager: "정연서",
        status: "거래완료",
        type: "주상복합",
        trade: "단기",
        price: "1억/441",
        property: "래미안서초",
        floor: "48동",
        unit: "630",
        supply: "102/60",
        pyeong: "44/33",
        households: "36/10",
        address: "서초동 663-13",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-12-07",
        shared: false,
        manager: "정연서",
        status: "거래가능",
        type: "빌라/연립",
        trade: "월세/렌트",
        price: "10억/464",
        property: "래미안용산",
        floor: "11동",
        unit: "1391",
        supply: "194/108",
        pyeong: "50/20",
        households: "36/40",
        address: "송파동 336-97",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-05-01",
        shared: false,
        manager: "하상현",
        status: "거래철회",
        type: "주상복합",
        trade: "단기",
        price: "4억/468",
        property: "래미안송파",
        floor: "15동",
        unit: "773",
        supply: "91/112",
        pyeong: "20/12",
        households: "50/45",
        address: "서초동 765-3",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-02-20",
        shared: true,
        manager: "정윤식",
        status: "거래철회",
        type: "빌라/연립",
        trade: "단기",
        price: "1억/271",
        property: "래미안서초",
        floor: "7동",
        unit: "1211",
        supply: "156/50",
        pyeong: "28/41",
        households: "4/45",
        address: "용산동 97-2",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-09-20",
        shared: false,
        manager: "정선혜",
        status: "거래철회",
        type: "오피스텔",
        trade: "전세",
        price: "23억",
        property: "래미안송파",
        floor: "21동",
        unit: "1612",
        supply: "125/90",
        pyeong: "46/27",
        households: "49/28",
        address: "용산동 796-70",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-04-29",
        shared: true,
        manager: "박소현",
        status: "거래보류",
        type: "빌라/연립",
        trade: "월세/렌트",
        price: "6억/347",
        property: "래미안강남",
        floor: "27동",
        unit: "321",
        supply: "100/116",
        pyeong: "33/31",
        households: "23/39",
        address: "서초동 928-95",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-12-06",
        shared: false,
        manager: "박소현",
        status: "거래완료",
        type: "빌라/연립",
        trade: "월세/렌트",
        price: "6억/146",
        property: "래미안강남",
        floor: "21동",
        unit: "1306",
        supply: "137/120",
        pyeong: "58/38",
        households: "7/27",
        address: "강남동 917-23",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-01-07",
        shared: false,
        manager: "송영주",
        status: "거래완료",
        type: "아파트",
        trade: "단기",
        price: "10억/310",
        property: "래미안용산",
        floor: "29동",
        unit: "1853",
        supply: "180/169",
        pyeong: "25/17",
        households: "8/47",
        address: "송파동 860-26",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-06-28",
        shared: false,
        manager: "송영주",
        status: "거래가능",
        type: "주상복합",
        trade: "단기",
        price: "7억/497",
        property: "래미안마포",
        floor: "6동",
        unit: "262",
        supply: "182/43",
        pyeong: "35/41",
        households: "1/22",
        address: "서초동 531-82",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-08-27",
        shared: false,
        manager: "하상현",
        status: "거래가능",
        type: "주상복합",
        trade: "전세",
        price: "24억",
        property: "래미안용산",
        floor: "11동",
        unit: "387",
        supply: "130/43",
        pyeong: "50/31",
        households: "3/42",
        address: "마포동 582-57",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-12-18",
        shared: true,
        manager: "하상현",
        status: "거래철회",
        type: "오피스텔",
        trade: "월세/렌트",
        price: "8억/197",
        property: "래미안송파",
        floor: "40동",
        unit: "1684",
        supply: "106/88",
        pyeong: "49/48",
        households: "31/48",
        address: "강남동 616-22",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-05-03",
        shared: false,
        manager: "하상현",
        status: "거래가능",
        type: "빌라/연립",
        trade: "단기",
        price: "9억/264",
        property: "래미안서초",
        floor: "5동",
        unit: "1238",
        supply: "190/78",
        pyeong: "22/18",
        households: "38/21",
        address: "마포동 549-96",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-04-30",
        shared: false,
        manager: "정연서",
        status: "거래철회",
        type: "주상복합",
        trade: "전세",
        price: "5억",
        property: "래미안서초",
        floor: "36동",
        unit: "1050",
        supply: "181/68",
        pyeong: "36/27",
        households: "4/30",
        address: "서초동 385-43",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-07-30",
        shared: false,
        manager: "김규민",
        status: "거래철회",
        type: "주상복합",
        trade: "단기",
        price: "7억/216",
        property: "래미안송파",
        floor: "17동",
        unit: "1297",
        supply: "58/156",
        pyeong: "19/39",
        households: "43/22",
        address: "용산동 997-79",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-05-09",
        shared: false,
        manager: "정연서",
        status: "거래보류",
        type: "빌라/연립",
        trade: "단기",
        price: "4억/105",
        property: "래미안서초",
        floor: "14동",
        unit: "1969",
        supply: "193/105",
        pyeong: "49/38",
        households: "13/12",
        address: "송파동 973-74",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-06-13",
        shared: false,
        manager: "송영주",
        status: "거래가능",
        type: "빌라/연립",
        trade: "매매",
        price: "49억",
        property: "래미안강남",
        floor: "18동",
        unit: "182",
        supply: "150/119",
        pyeong: "39/53",
        households: "31/39",
        address: "강남동 186-58",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-03-05",
        shared: true,
        manager: "정윤식",
        status: "거래가능",
        type: "아파트",
        trade: "전세",
        price: "30억",
        property: "래미안마포",
        floor: "36동",
        unit: "1837",
        supply: "125/151",
        pyeong: "39/32",
        households: "32/38",
        address: "마포동 214-66",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-11-18",
        shared: true,
        manager: "정선혜",
        status: "거래보류",
        type: "오피스텔",
        trade: "전세",
        price: "29억",
        property: "래미안강남",
        floor: "33동",
        unit: "197",
        supply: "187/116",
        pyeong: "55/33",
        households: "20/19",
        address: "강남동 461-83",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-01-28",
        shared: true,
        manager: "정선혜",
        status: "거래철회",
        type: "아파트",
        trade: "단기",
        price: "7억/498",
        property: "래미안용산",
        floor: "48동",
        unit: "1203",
        supply: "95/147",
        pyeong: "37/43",
        households: "14/13",
        address: "마포동 450-68",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-07-07",
        shared: true,
        manager: "정서연",
        status: "거래보류",
        type: "주상복합",
        trade: "전세",
        price: "8억",
        property: "래미안용산",
        floor: "6동",
        unit: "648",
        supply: "195/156",
        pyeong: "35/45",
        households: "32/29",
        address: "송파동 778-79",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-09-22",
        shared: false,
        manager: "송영주",
        status: "거래보류",
        type: "주상복합",
        trade: "단기",
        price: "1억/139",
        property: "래미안송파",
        floor: "38동",
        unit: "1968",
        supply: "194/132",
        pyeong: "32/44",
        households: "4/25",
        address: "서초동 87-57",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-07-29",
        shared: false,
        manager: "송영주",
        status: "거래철회",
        type: "아파트",
        trade: "전세",
        price: "13억",
        property: "래미안강남",
        floor: "42동",
        unit: "1797",
        supply: "125/111",
        pyeong: "16/52",
        households: "16/35",
        address: "용산동 11-74",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-04-09",
        shared: false,
        manager: "정선혜",
        status: "거래보류",
        type: "아파트",
        trade: "월세/렌트",
        price: "3억/184",
        property: "래미안서초",
        floor: "2동",
        unit: "644",
        supply: "188/83",
        pyeong: "26/50",
        households: "30/46",
        address: "용산동 225-85",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-02-22",
        shared: false,
        manager: "정서연",
        status: "거래보류",
        type: "아파트",
        trade: "단기",
        price: "3억/202",
        property: "래미안송파",
        floor: "37동",
        unit: "532",
        supply: "134/70",
        pyeong: "56/18",
        households: "11/18",
        address: "서초동 67-61",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-07-21",
        shared: true,
        manager: "정서연",
        status: "거래보류",
        type: "빌라/연립",
        trade: "월세/렌트",
        price: "3억/291",
        property: "래미안용산",
        floor: "46동",
        unit: "1423",
        supply: "98/164",
        pyeong: "26/48",
        households: "13/15",
        address: "용산동 317-88",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-05-13",
        shared: true,
        manager: "정윤식",
        status: "거래보류",
        type: "빌라/연립",
        trade: "단기",
        price: "2억/415",
        property: "래미안서초",
        floor: "28동",
        unit: "1313",
        supply: "152/135",
        pyeong: "32/38",
        households: "5/39",
        address: "송파동 123-98",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-11-19",
        shared: true,
        manager: "하상현",
        status: "거래보류",
        type: "빌라/연립",
        trade: "매매",
        price: "39억",
        property: "래미안강남",
        floor: "29동",
        unit: "762",
        supply: "132/110",
        pyeong: "50/32",
        households: "50/27",
        address: "마포동 546-41",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-03-10",
        shared: false,
        manager: "정선혜",
        status: "거래철회",
        type: "빌라/연립",
        trade: "단기",
        price: "10억/455",
        property: "래미안송파",
        floor: "31동",
        unit: "1202",
        supply: "167/121",
        pyeong: "35/54",
        households: "39/12",
        address: "강남동 103-95",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-01-16",
        shared: true,
        manager: "정윤식",
        status: "거래보류",
        type: "빌라/연립",
        trade: "매매",
        price: "46억",
        property: "래미안용산",
        floor: "37동",
        unit: "507",
        supply: "192/139",
        pyeong: "46/21",
        households: "26/37",
        address: "강남동 951-68",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-01-10",
        shared: false,
        manager: "정연서",
        status: "거래가능",
        type: "주상복합",
        trade: "단기",
        price: "10억/376",
        property: "래미안마포",
        floor: "17동",
        unit: "1506",
        supply: "119/106",
        pyeong: "40/44",
        households: "32/14",
        address: "용산동 525-10",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-10-15",
        shared: true,
        manager: "송영주",
        status: "거래가능",
        type: "아파트",
        trade: "전세",
        price: "11억",
        property: "래미안강남",
        floor: "1동",
        unit: "1909",
        supply: "98/62",
        pyeong: "45/38",
        households: "4/39",
        address: "강남동 505-88",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-11-04",
        shared: false,
        manager: "정연서",
        status: "거래철회",
        type: "오피스텔",
        trade: "전세",
        price: "14억",
        property: "래미안강남",
        floor: "42동",
        unit: "1331",
        supply: "105/140",
        pyeong: "51/42",
        households: "9/19",
        address: "마포동 20-43",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-10-04",
        shared: false,
        manager: "정연서",
        status: "거래가능",
        type: "빌라/연립",
        trade: "단기",
        price: "10억/153",
        property: "래미안서초",
        floor: "7동",
        unit: "1615",
        supply: "154/114",
        pyeong: "24/38",
        households: "39/22",
        address: "마포동 876-75",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-03-04",
        shared: false,
        manager: "김규민",
        status: "거래보류",
        type: "오피스텔",
        trade: "매매",
        price: "7억",
        property: "래미안마포",
        floor: "17동",
        unit: "1239",
        supply: "135/72",
        pyeong: "55/13",
        households: "39/13",
        address: "서초동 112-51",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-12-18",
        shared: false,
        manager: "하상현",
        status: "거래완료",
        type: "빌라/연립",
        trade: "매매",
        price: "9억",
        property: "래미안서초",
        floor: "26동",
        unit: "1163",
        supply: "62/105",
        pyeong: "17/20",
        households: "21/22",
        address: "송파동 786-8",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-11-28",
        shared: false,
        manager: "김규민",
        status: "거래철회",
        type: "오피스텔",
        trade: "매매",
        price: "49억",
        property: "래미안송파",
        floor: "6동",
        unit: "1452",
        supply: "61/73",
        pyeong: "38/31",
        households: "6/47",
        address: "송파동 196-11",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-12-25",
        shared: true,
        manager: "정선혜",
        status: "거래철회",
        type: "빌라/연립",
        trade: "매매",
        price: "49억",
        property: "래미안강남",
        floor: "31동",
        unit: "1607",
        supply: "114/90",
        pyeong: "36/32",
        households: "23/37",
        address: "마포동 366-90",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-11-20",
        shared: true,
        manager: "하상현",
        status: "거래철회",
        type: "주상복합",
        trade: "단기",
        price: "4억/434",
        property: "래미안서초",
        floor: "28동",
        unit: "1690",
        supply: "103/62",
        pyeong: "42/14",
        households: "37/26",
        address: "송파동 233-33",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-12-25",
        shared: true,
        manager: "정연서",
        status: "거래가능",
        type: "빌라/연립",
        trade: "전세",
        price: "7억",
        property: "래미안송파",
        floor: "5동",
        unit: "1174",
        supply: "195/82",
        pyeong: "38/45",
        households: "38/44",
        address: "송파동 59-86",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-06-17",
        shared: false,
        manager: "정연서",
        status: "거래철회",
        type: "아파트",
        trade: "전세",
        price: "4억",
        property: "래미안마포",
        floor: "29동",
        unit: "1416",
        supply: "111/157",
        pyeong: "16/16",
        households: "17/23",
        address: "송파동 217-59",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-01-22",
        shared: true,
        manager: "정서연",
        status: "거래가능",
        type: "주상복합",
        trade: "전세",
        price: "19억",
        property: "래미안용산",
        floor: "50동",
        unit: "405",
        supply: "55/50",
        pyeong: "30/15",
        households: "37/20",
        address: "송파동 923-60",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-01-25",
        shared: true,
        manager: "박소현",
        status: "거래보류",
        type: "주상복합",
        trade: "전세",
        price: "26억",
        property: "래미안마포",
        floor: "11동",
        unit: "1814",
        supply: "113/155",
        pyeong: "30/38",
        households: "24/49",
        address: "마포동 799-19",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-04-06",
        shared: false,
        manager: "정윤식",
        status: "거래가능",
        type: "오피스텔",
        trade: "매매",
        price: "22억",
        property: "래미안서초",
        floor: "49동",
        unit: "1212",
        supply: "177/172",
        pyeong: "42/41",
        households: "47/36",
        address: "강남동 396-13",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-11-08",
        shared: false,
        manager: "정연서",
        status: "거래완료",
        type: "아파트",
        trade: "월세/렌트",
        price: "4억/141",
        property: "래미안마포",
        floor: "9동",
        unit: "872",
        supply: "145/114",
        pyeong: "16/13",
        households: "4/30",
        address: "서초동 294-84",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-08-11",
        shared: false,
        manager: "박소현",
        status: "거래완료",
        type: "아파트",
        trade: "단기",
        price: "4억/429",
        property: "래미안용산",
        floor: "5동",
        unit: "713",
        supply: "100/126",
        pyeong: "19/13",
        households: "13/22",
        address: "마포동 250-19",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-01-21",
        shared: false,
        manager: "정윤식",
        status: "거래완료",
        type: "아파트",
        trade: "매매",
        price: "37억",
        property: "래미안송파",
        floor: "6동",
        unit: "369",
        supply: "192/139",
        pyeong: "55/52",
        households: "24/30",
        address: "송파동 569-34",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-09-09",
        shared: false,
        manager: "정선혜",
        status: "거래가능",
        type: "아파트",
        trade: "단기",
        price: "8억/185",
        property: "래미안강남",
        floor: "1동",
        unit: "1822",
        supply: "98/94",
        pyeong: "46/18",
        households: "21/12",
        address: "용산동 918-74",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-08-23",
        shared: false,
        manager: "하상현",
        status: "거래보류",
        type: "빌라/연립",
        trade: "전세",
        price: "30억",
        property: "래미안용산",
        floor: "21동",
        unit: "1260",
        supply: "169/88",
        pyeong: "28/17",
        households: "24/46",
        address: "서초동 88-4",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-01-06",
        shared: true,
        manager: "정서연",
        status: "거래완료",
        type: "빌라/연립",
        trade: "전세",
        price: "28억",
        property: "래미안용산",
        floor: "19동",
        unit: "1739",
        supply: "167/91",
        pyeong: "34/53",
        households: "23/22",
        address: "서초동 844-84",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-07-08",
        shared: false,
        manager: "송영주",
        status: "거래철회",
        type: "주상복합",
        trade: "매매",
        price: "14억",
        property: "래미안마포",
        floor: "41동",
        unit: "355",
        supply: "194/102",
        pyeong: "36/28",
        households: "50/10",
        address: "마포동 701-23",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-04-26",
        shared: true,
        manager: "송영주",
        status: "거래철회",
        type: "주상복합",
        trade: "전세",
        price: "11억",
        property: "래미안강남",
        floor: "14동",
        unit: "1874",
        supply: "145/124",
        pyeong: "39/23",
        households: "47/46",
        address: "마포동 784-18",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-08-06",
        shared: false,
        manager: "박소현",
        status: "거래가능",
        type: "주상복합",
        trade: "월세/렌트",
        price: "8억/426",
        property: "래미안마포",
        floor: "38동",
        unit: "570",
        supply: "94/109",
        pyeong: "23/35",
        households: "45/39",
        address: "송파동 111-35",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-11-27",
        shared: true,
        manager: "김규민",
        status: "거래보류",
        type: "빌라/연립",
        trade: "매매",
        price: "23억",
        property: "래미안용산",
        floor: "11동",
        unit: "451",
        supply: "146/113",
        pyeong: "41/34",
        households: "41/16",
        address: "용산동 442-6",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-05-23",
        shared: true,
        manager: "정서연",
        status: "거래완료",
        type: "주상복합",
        trade: "단기",
        price: "2억/185",
        property: "래미안용산",
        floor: "26동",
        unit: "709",
        supply: "140/127",
        pyeong: "60/38",
        households: "31/22",
        address: "강남동 112-20",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-03-15",
        shared: true,
        manager: "정연서",
        status: "거래철회",
        type: "아파트",
        trade: "월세/렌트",
        price: "8억/450",
        property: "래미안용산",
        floor: "5동",
        unit: "1161",
        supply: "83/91",
        pyeong: "54/52",
        households: "43/15",
        address: "용산동 806-70",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-07-27",
        shared: true,
        manager: "하상현",
        status: "거래완료",
        type: "빌라/연립",
        trade: "월세/렌트",
        price: "4억/374",
        property: "래미안용산",
        floor: "41동",
        unit: "597",
        supply: "172/70",
        pyeong: "34/54",
        households: "46/28",
        address: "마포동 73-73",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-05-06",
        shared: true,
        manager: "박소현",
        status: "거래철회",
        type: "오피스텔",
        trade: "전세",
        price: "5억",
        property: "래미안강남",
        floor: "17동",
        unit: "837",
        supply: "57/68",
        pyeong: "37/51",
        households: "45/49",
        address: "서초동 167-20",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-10-24",
        shared: true,
        manager: "정선혜",
        status: "거래철회",
        type: "빌라/연립",
        trade: "매매",
        price: "24억",
        property: "래미안송파",
        floor: "41동",
        unit: "442",
        supply: "52/126",
        pyeong: "36/22",
        households: "48/35",
        address: "서초동 505-48",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-01-15",
        shared: false,
        manager: "박소현",
        status: "거래보류",
        type: "아파트",
        trade: "단기",
        price: "4억/272",
        property: "래미안강남",
        floor: "46동",
        unit: "768",
        supply: "181/113",
        pyeong: "53/35",
        households: "43/16",
        address: "용산동 281-79",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-06-16",
        shared: true,
        manager: "송영주",
        status: "거래보류",
        type: "주상복합",
        trade: "단기",
        price: "4억/309",
        property: "래미안송파",
        floor: "37동",
        unit: "1643",
        supply: "64/72",
        pyeong: "34/14",
        households: "7/17",
        address: "송파동 993-53",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-05-31",
        shared: false,
        manager: "송영주",
        status: "거래철회",
        type: "빌라/연립",
        trade: "매매",
        price: "31억",
        property: "래미안마포",
        floor: "38동",
        unit: "687",
        supply: "143/170",
        pyeong: "29/14",
        households: "36/26",
        address: "마포동 461-23",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-11-25",
        shared: true,
        manager: "정윤식",
        status: "거래가능",
        type: "빌라/연립",
        trade: "매매",
        price: "19억",
        property: "래미안송파",
        floor: "50동",
        unit: "1681",
        supply: "137/104",
        pyeong: "38/36",
        households: "17/44",
        address: "마포동 719-69",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-03-25",
        shared: true,
        manager: "정선혜",
        status: "거래철회",
        type: "오피스텔",
        trade: "월세/렌트",
        price: "7억/449",
        property: "래미안용산",
        floor: "15동",
        unit: "1098",
        supply: "110/117",
        pyeong: "41/20",
        households: "31/27",
        address: "마포동 133-67",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-05-15",
        shared: false,
        manager: "정윤식",
        status: "거래철회",
        type: "빌라/연립",
        trade: "단기",
        price: "3억/101",
        property: "래미안용산",
        floor: "3동",
        unit: "1265",
        supply: "108/115",
        pyeong: "51/55",
        households: "19/19",
        address: "서초동 521-21",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-08-13",
        shared: true,
        manager: "김규민",
        status: "거래보류",
        type: "주상복합",
        trade: "전세",
        price: "3억",
        property: "래미안송파",
        floor: "30동",
        unit: "202",
        supply: "122/167",
        pyeong: "30/54",
        households: "26/40",
        address: "서초동 648-18",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-12-14",
        shared: true,
        manager: "정선혜",
        status: "거래가능",
        type: "아파트",
        trade: "단기",
        price: "1억/434",
        property: "래미안송파",
        floor: "19동",
        unit: "576",
        supply: "51/85",
        pyeong: "41/22",
        households: "4/15",
        address: "송파동 447-86",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-10-06",
        shared: false,
        manager: "김규민",
        status: "거래완료",
        type: "주상복합",
        trade: "전세",
        price: "13억",
        property: "래미안마포",
        floor: "1동",
        unit: "336",
        supply: "101/133",
        pyeong: "20/25",
        households: "7/19",
        address: "마포동 575-81",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-11-23",
        shared: true,
        manager: "하상현",
        status: "거래가능",
        type: "빌라/연립",
        trade: "월세/렌트",
        price: "7억/328",
        property: "래미안송파",
        floor: "2동",
        unit: "1519",
        supply: "92/141",
        pyeong: "47/38",
        households: "7/10",
        address: "송파동 597-33",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-05-01",
        shared: true,
        manager: "하상현",
        status: "거래철회",
        type: "빌라/연립",
        trade: "월세/렌트",
        price: "2억/226",
        property: "래미안서초",
        floor: "2동",
        unit: "1419",
        supply: "75/164",
        pyeong: "35/21",
        households: "35/47",
        address: "용산동 847-18",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-07-28",
        shared: false,
        manager: "하상현",
        status: "거래보류",
        type: "주상복합",
        trade: "매매",
        price: "49억",
        property: "래미안송파",
        floor: "10동",
        unit: "329",
        supply: "58/96",
        pyeong: "47/43",
        households: "21/16",
        address: "서초동 909-80",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-05-22",
        shared: false,
        manager: "정선혜",
        status: "거래보류",
        type: "아파트",
        trade: "월세/렌트",
        price: "2억/437",
        property: "래미안마포",
        floor: "10동",
        unit: "1008",
        supply: "97/53",
        pyeong: "49/54",
        households: "21/43",
        address: "강남동 256-27",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-03-27",
        shared: false,
        manager: "하상현",
        status: "거래가능",
        type: "아파트",
        trade: "전세",
        price: "20억",
        property: "래미안용산",
        floor: "38동",
        unit: "1665",
        supply: "199/149",
        pyeong: "58/52",
        households: "39/36",
        address: "강남동 17-65",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-06-04",
        shared: true,
        manager: "정윤식",
        status: "거래철회",
        type: "오피스텔",
        trade: "단기",
        price: "2억/302",
        property: "래미안용산",
        floor: "10동",
        unit: "1872",
        supply: "134/100",
        pyeong: "40/38",
        households: "34/24",
        address: "서초동 834-74",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-07-07",
        shared: false,
        manager: "김규민",
        status: "거래철회",
        type: "오피스텔",
        trade: "매매",
        price: "15억",
        property: "래미안용산",
        floor: "34동",
        unit: "1760",
        supply: "88/152",
        pyeong: "16/47",
        households: "49/37",
        address: "서초동 82-82",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-11-22",
        shared: true,
        manager: "하상현",
        status: "거래보류",
        type: "아파트",
        trade: "전세",
        price: "12억",
        property: "래미안서초",
        floor: "44동",
        unit: "168",
        supply: "185/112",
        pyeong: "18/40",
        households: "20/32",
        address: "서초동 817-49",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-05-09",
        shared: true,
        manager: "정서연",
        status: "거래가능",
        type: "아파트",
        trade: "매매",
        price: "48억",
        property: "래미안마포",
        floor: "22동",
        unit: "106",
        supply: "181/51",
        pyeong: "27/28",
        households: "37/32",
        address: "송파동 983-78",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-01-21",
        shared: true,
        manager: "송영주",
        status: "거래철회",
        type: "주상복합",
        trade: "월세/렌트",
        price: "7억/213",
        property: "래미안송파",
        floor: "47동",
        unit: "517",
        supply: "149/52",
        pyeong: "58/25",
        households: "8/12",
        address: "송파동 287-11",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-08-03",
        shared: false,
        manager: "정윤식",
        status: "거래가능",
        type: "주상복합",
        trade: "월세/렌트",
        price: "4억/439",
        property: "래미안용산",
        floor: "2동",
        unit: "1828",
        supply: "67/51",
        pyeong: "28/47",
        households: "43/28",
        address: "송파동 113-81",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-01-25",
        shared: false,
        manager: "하상현",
        status: "거래완료",
        type: "오피스텔",
        trade: "단기",
        price: "3억/206",
        property: "래미안강남",
        floor: "11동",
        unit: "1965",
        supply: "189/89",
        pyeong: "32/39",
        households: "33/43",
        address: "용산동 654-93",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-02-21",
        shared: true,
        manager: "정연서",
        status: "거래가능",
        type: "주상복합",
        trade: "월세/렌트",
        price: "5억/337",
        property: "래미안송파",
        floor: "35동",
        unit: "260",
        supply: "50/122",
        pyeong: "21/50",
        households: "29/26",
        address: "마포동 357-23",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-01-21",
        shared: false,
        manager: "정선혜",
        status: "거래완료",
        type: "아파트",
        trade: "매매",
        price: "40억",
        property: "래미안용산",
        floor: "2동",
        unit: "1390",
        supply: "82/103",
        pyeong: "54/46",
        households: "17/45",
        address: "송파동 507-38",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-08-30",
        shared: false,
        manager: "정연서",
        status: "거래철회",
        type: "아파트",
        trade: "월세/렌트",
        price: "7억/232",
        property: "래미안서초",
        floor: "19동",
        unit: "1871",
        supply: "77/156",
        pyeong: "36/30",
        households: "20/34",
        address: "서초동 363-43",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-04-06",
        shared: false,
        manager: "정연서",
        status: "거래철회",
        type: "아파트",
        trade: "월세/렌트",
        price: "9억/255",
        property: "래미안용산",
        floor: "1동",
        unit: "1929",
        supply: "186/117",
        pyeong: "38/23",
        households: "2/47",
        address: "용산동 445-2",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-10-03",
        shared: false,
        manager: "송영주",
        status: "거래가능",
        type: "주상복합",
        trade: "전세",
        price: "30억",
        property: "래미안강남",
        floor: "8동",
        unit: "1314",
        supply: "151/153",
        pyeong: "22/38",
        households: "14/26",
        address: "용산동 474-56",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-11-16",
        shared: false,
        manager: "정서연",
        status: "거래보류",
        type: "오피스텔",
        trade: "월세/렌트",
        price: "9억/305",
        property: "래미안서초",
        floor: "34동",
        unit: "853",
        supply: "102/130",
        pyeong: "37/30",
        households: "39/23",
        address: "마포동 771-88",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-12-10",
        shared: true,
        manager: "정서연",
        status: "거래완료",
        type: "빌라/연립",
        trade: "월세/렌트",
        price: "10억/107",
        property: "래미안강남",
        floor: "41동",
        unit: "601",
        supply: "143/120",
        pyeong: "17/26",
        households: "44/14",
        address: "송파동 728-57",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-06-30",
        shared: true,
        manager: "정선혜",
        status: "거래보류",
        type: "오피스텔",
        trade: "단기",
        price: "3억/137",
        property: "래미안서초",
        floor: "24동",
        unit: "578",
        supply: "63/51",
        pyeong: "21/46",
        households: "26/18",
        address: "서초동 569-76",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-08-11",
        shared: false,
        manager: "정연서",
        status: "거래완료",
        type: "빌라/연립",
        trade: "전세",
        price: "9억",
        property: "래미안송파",
        floor: "50동",
        unit: "983",
        supply: "91/157",
        pyeong: "51/52",
        households: "44/41",
        address: "강남동 426-49",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-07-27",
        shared: true,
        manager: "정서연",
        status: "거래보류",
        type: "아파트",
        trade: "월세/렌트",
        price: "4억/378",
        property: "래미안마포",
        floor: "3동",
        unit: "701",
        supply: "196/152",
        pyeong: "55/38",
        households: "25/47",
        address: "송파동 967-70",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-08-18",
        shared: true,
        manager: "정윤식",
        status: "거래가능",
        type: "빌라/연립",
        trade: "전세",
        price: "23억",
        property: "래미안서초",
        floor: "6동",
        unit: "1296",
        supply: "71/159",
        pyeong: "44/19",
        households: "14/29",
        address: "송파동 551-43",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-06-10",
        shared: true,
        manager: "김규민",
        status: "거래가능",
        type: "아파트",
        trade: "단기",
        price: "6억/436",
        property: "래미안송파",
        floor: "50동",
        unit: "1676",
        supply: "70/59",
        pyeong: "32/40",
        households: "41/12",
        address: "마포동 580-66",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-03-21",
        shared: true,
        manager: "정선혜",
        status: "거래철회",
        type: "오피스텔",
        trade: "월세/렌트",
        price: "1억/338",
        property: "래미안서초",
        floor: "35동",
        unit: "1592",
        supply: "172/79",
        pyeong: "38/44",
        households: "22/34",
        address: "서초동 873-57",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-10-18",
        shared: true,
        manager: "하상현",
        status: "거래보류",
        type: "빌라/연립",
        trade: "단기",
        price: "8억/463",
        property: "래미안강남",
        floor: "29동",
        unit: "422",
        supply: "52/133",
        pyeong: "29/30",
        households: "27/11",
        address: "강남동 972-64",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-10-21",
        shared: true,
        manager: "정서연",
        status: "거래가능",
        type: "빌라/연립",
        trade: "단기",
        price: "3억/413",
        property: "래미안강남",
        floor: "49동",
        unit: "993",
        supply: "171/134",
        pyeong: "20/33",
        households: "37/41",
        address: "서초동 680-46",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-12-11",
        shared: true,
        manager: "박소현",
        status: "거래완료",
        type: "빌라/연립",
        trade: "전세",
        price: "27억",
        property: "래미안강남",
        floor: "14동",
        unit: "1400",
        supply: "195/122",
        pyeong: "34/25",
        households: "41/41",
        address: "용산동 561-96",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-06-24",
        shared: true,
        manager: "정연서",
        status: "거래가능",
        type: "빌라/연립",
        trade: "매매",
        price: "28억",
        property: "래미안송파",
        floor: "9동",
        unit: "581",
        supply: "72/98",
        pyeong: "29/26",
        households: "31/40",
        address: "서초동 570-45",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-11-14",
        shared: true,
        manager: "박소현",
        status: "거래완료",
        type: "빌라/연립",
        trade: "전세",
        price: "11억",
        property: "래미안마포",
        floor: "22동",
        unit: "1027",
        supply: "56/153",
        pyeong: "37/42",
        households: "15/26",
        address: "마포동 836-77",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-07-02",
        shared: false,
        manager: "정서연",
        status: "거래완료",
        type: "빌라/연립",
        trade: "월세/렌트",
        price: "10억/176",
        property: "래미안송파",
        floor: "21동",
        unit: "1546",
        supply: "141/122",
        pyeong: "23/38",
        households: "24/49",
        address: "서초동 227-41",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-01-14",
        shared: false,
        manager: "김규민",
        status: "거래가능",
        type: "주상복합",
        trade: "전세",
        price: "9억",
        property: "래미안용산",
        floor: "3동",
        unit: "1468",
        supply: "59/49",
        pyeong: "29/12",
        households: "43/22",
        address: "서초동 610-94",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-02-07",
        shared: true,
        manager: "정선혜",
        status: "거래보류",
        type: "오피스텔",
        trade: "전세",
        price: "23억",
        property: "래미안마포",
        floor: "21동",
        unit: "1381",
        supply: "59/130",
        pyeong: "18/45",
        households: "50/32",
        address: "강남동 895-5",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-03-10",
        shared: false,
        manager: "정서연",
        status: "거래완료",
        type: "빌라/연립",
        trade: "월세/렌트",
        price: "9억/348",
        property: "래미안용산",
        floor: "47동",
        unit: "502",
        supply: "186/117",
        pyeong: "48/35",
        households: "25/44",
        address: "송파동 280-33",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-01-16",
        shared: true,
        manager: "정연서",
        status: "거래가능",
        type: "주상복합",
        trade: "단기",
        price: "3억/360",
        property: "래미안용산",
        floor: "19동",
        unit: "1781",
        supply: "197/44",
        pyeong: "34/49",
        households: "27/48",
        address: "송파동 325-68",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-01-19",
        shared: true,
        manager: "정선혜",
        status: "거래철회",
        type: "빌라/연립",
        trade: "월세/렌트",
        price: "9억/476",
        property: "래미안마포",
        floor: "14동",
        unit: "619",
        supply: "160/41",
        pyeong: "20/50",
        households: "43/34",
        address: "마포동 941-68",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-02-25",
        shared: false,
        manager: "하상현",
        status: "거래철회",
        type: "빌라/연립",
        trade: "월세/렌트",
        price: "9억/446",
        property: "래미안용산",
        floor: "19동",
        unit: "632",
        supply: "177/50",
        pyeong: "29/21",
        households: "48/18",
        address: "서초동 545-4",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-04-25",
        shared: true,
        manager: "정선혜",
        status: "거래완료",
        type: "아파트",
        trade: "단기",
        price: "3억/136",
        property: "래미안마포",
        floor: "15동",
        unit: "765",
        supply: "200/116",
        pyeong: "55/43",
        households: "13/36",
        address: "마포동 299-93",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-12-01",
        shared: true,
        manager: "박소현",
        status: "거래가능",
        type: "오피스텔",
        trade: "단기",
        price: "5억/354",
        property: "래미안강남",
        floor: "15동",
        unit: "449",
        supply: "76/133",
        pyeong: "46/52",
        households: "11/48",
        address: "송파동 158-30",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-10-27",
        shared: false,
        manager: "김규민",
        status: "거래보류",
        type: "오피스텔",
        trade: "매매",
        price: "17억",
        property: "래미안용산",
        floor: "19동",
        unit: "1002",
        supply: "136/97",
        pyeong: "46/42",
        households: "10/15",
        address: "용산동 343-87",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-11-20",
        shared: false,
        manager: "정윤식",
        status: "거래보류",
        type: "오피스텔",
        trade: "매매",
        price: "38억",
        property: "래미안서초",
        floor: "42동",
        unit: "1790",
        supply: "166/99",
        pyeong: "35/47",
        households: "24/28",
        address: "용산동 261-70",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-08-04",
        shared: false,
        manager: "송영주",
        status: "거래보류",
        type: "빌라/연립",
        trade: "전세",
        price: "5억",
        property: "래미안서초",
        floor: "3동",
        unit: "1846",
        supply: "144/48",
        pyeong: "29/41",
        households: "16/48",
        address: "용산동 162-88",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-06-23",
        shared: false,
        manager: "송영주",
        status: "거래완료",
        type: "아파트",
        trade: "단기",
        price: "5억/460",
        property: "래미안송파",
        floor: "45동",
        unit: "1056",
        supply: "56/101",
        pyeong: "25/46",
        households: "7/30",
        address: "마포동 352-1",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-03-05",
        shared: true,
        manager: "하상현",
        status: "거래보류",
        type: "오피스텔",
        trade: "단기",
        price: "10억/451",
        property: "래미안서초",
        floor: "32동",
        unit: "1548",
        supply: "90/84",
        pyeong: "25/17",
        households: "2/26",
        address: "송파동 587-48",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-09-06",
        shared: false,
        manager: "박소현",
        status: "거래보류",
        type: "빌라/연립",
        trade: "전세",
        price: "30억",
        property: "래미안서초",
        floor: "31동",
        unit: "682",
        supply: "59/86",
        pyeong: "56/18",
        households: "16/18",
        address: "마포동 540-90",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-05-17",
        shared: false,
        manager: "박소현",
        status: "거래가능",
        type: "빌라/연립",
        trade: "단기",
        price: "6억/211",
        property: "래미안용산",
        floor: "37동",
        unit: "1964",
        supply: "178/158",
        pyeong: "47/26",
        households: "13/31",
        address: "마포동 939-13",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-08-13",
        shared: true,
        manager: "김규민",
        status: "거래가능",
        type: "주상복합",
        trade: "단기",
        price: "4억/151",
        property: "래미안강남",
        floor: "37동",
        unit: "1612",
        supply: "119/60",
        pyeong: "25/19",
        households: "29/42",
        address: "강남동 189-54",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-01-20",
        shared: false,
        manager: "하상현",
        status: "거래철회",
        type: "빌라/연립",
        trade: "월세/렌트",
        price: "5억/119",
        property: "래미안서초",
        floor: "48동",
        unit: "1732",
        supply: "121/57",
        pyeong: "37/31",
        households: "46/44",
        address: "마포동 182-56",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-10-05",
        shared: true,
        manager: "정윤식",
        status: "거래철회",
        type: "주상복합",
        trade: "전세",
        price: "22억",
        property: "래미안송파",
        floor: "2동",
        unit: "407",
        supply: "161/44",
        pyeong: "35/51",
        households: "13/12",
        address: "서초동 258-58",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-02-01",
        shared: true,
        manager: "정서연",
        status: "거래보류",
        type: "빌라/연립",
        trade: "매매",
        price: "17억",
        property: "래미안강남",
        floor: "31동",
        unit: "1227",
        supply: "99/129",
        pyeong: "46/49",
        households: "37/16",
        address: "용산동 304-42",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-10-22",
        shared: false,
        manager: "김규민",
        status: "거래보류",
        type: "빌라/연립",
        trade: "전세",
        price: "8억",
        property: "래미안마포",
        floor: "28동",
        unit: "949",
        supply: "169/105",
        pyeong: "58/37",
        households: "11/50",
        address: "용산동 68-91",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-10-29",
        shared: true,
        manager: "박소현",
        status: "거래철회",
        type: "아파트",
        trade: "단기",
        price: "7억/188",
        property: "래미안강남",
        floor: "1동",
        unit: "1095",
        supply: "106/107",
        pyeong: "25/55",
        households: "8/25",
        address: "마포동 97-14",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-01-28",
        shared: true,
        manager: "정선혜",
        status: "거래가능",
        type: "오피스텔",
        trade: "매매",
        price: "27억",
        property: "래미안용산",
        floor: "2동",
        unit: "414",
        supply: "94/135",
        pyeong: "55/49",
        households: "5/25",
        address: "송파동 883-64",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-06-11",
        shared: false,
        manager: "박소현",
        status: "거래가능",
        type: "오피스텔",
        trade: "전세",
        price: "4억",
        property: "래미안마포",
        floor: "25동",
        unit: "1724",
        supply: "118/178",
        pyeong: "54/43",
        households: "26/26",
        address: "용산동 605-37",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-05-05",
        shared: false,
        manager: "정서연",
        status: "거래철회",
        type: "빌라/연립",
        trade: "매매",
        price: "15억",
        property: "래미안강남",
        floor: "43동",
        unit: "895",
        supply: "130/77",
        pyeong: "35/51",
        households: "10/49",
        address: "서초동 129-46",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-02-27",
        shared: false,
        manager: "박소현",
        status: "거래가능",
        type: "주상복합",
        trade: "월세/렌트",
        price: "3억/116",
        property: "래미안서초",
        floor: "22동",
        unit: "326",
        supply: "71/131",
        pyeong: "51/31",
        households: "37/17",
        address: "용산동 495-61",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-12-30",
        shared: false,
        manager: "정서연",
        status: "거래완료",
        type: "빌라/연립",
        trade: "전세",
        price: "8억",
        property: "래미안서초",
        floor: "27동",
        unit: "370",
        supply: "101/65",
        pyeong: "30/19",
        households: "26/17",
        address: "서초동 947-20",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-02-16",
        shared: true,
        manager: "정서연",
        status: "거래가능",
        type: "빌라/연립",
        trade: "월세/렌트",
        price: "7억/488",
        property: "래미안마포",
        floor: "9동",
        unit: "863",
        supply: "181/157",
        pyeong: "55/14",
        households: "15/49",
        address: "마포동 777-7",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-04-03",
        shared: true,
        manager: "박소현",
        status: "거래철회",
        type: "주상복합",
        trade: "단기",
        price: "7억/297",
        property: "래미안강남",
        floor: "25동",
        unit: "1920",
        supply: "82/48",
        pyeong: "53/23",
        households: "44/29",
        address: "마포동 159-27",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-08-15",
        shared: false,
        manager: "정서연",
        status: "거래완료",
        type: "빌라/연립",
        trade: "매매",
        price: "5억",
        property: "래미안강남",
        floor: "8동",
        unit: "194",
        supply: "195/170",
        pyeong: "29/47",
        households: "39/11",
        address: "용산동 800-9",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-06-17",
        shared: true,
        manager: "정연서",
        status: "거래철회",
        type: "아파트",
        trade: "매매",
        price: "39억",
        property: "래미안마포",
        floor: "6동",
        unit: "1322",
        supply: "108/113",
        pyeong: "22/33",
        households: "44/40",
        address: "강남동 530-57",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-03-12",
        shared: false,
        manager: "하상현",
        status: "거래가능",
        type: "주상복합",
        trade: "단기",
        price: "2억/305",
        property: "래미안송파",
        floor: "27동",
        unit: "1688",
        supply: "151/53",
        pyeong: "16/30",
        households: "43/21",
        address: "강남동 171-37",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-05-26",
        shared: true,
        manager: "하상현",
        status: "거래가능",
        type: "주상복합",
        trade: "전세",
        price: "20억",
        property: "래미안용산",
        floor: "50동",
        unit: "1731",
        supply: "160/113",
        pyeong: "50/45",
        households: "1/37",
        address: "마포동 193-78",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-02-14",
        shared: true,
        manager: "박소현",
        status: "거래철회",
        type: "오피스텔",
        trade: "매매",
        price: "21억",
        property: "래미안서초",
        floor: "6동",
        unit: "1562",
        supply: "179/76",
        pyeong: "19/54",
        households: "12/42",
        address: "마포동 801-15",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-07-07",
        shared: false,
        manager: "정연서",
        status: "거래철회",
        type: "빌라/연립",
        trade: "매매",
        price: "30억",
        property: "래미안서초",
        floor: "46동",
        unit: "219",
        supply: "163/173",
        pyeong: "15/32",
        households: "35/17",
        address: "강남동 359-64",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-12-30",
        shared: false,
        manager: "정선혜",
        status: "거래보류",
        type: "주상복합",
        trade: "단기",
        price: "6억/226",
        property: "래미안서초",
        floor: "50동",
        unit: "1325",
        supply: "173/95",
        pyeong: "44/46",
        households: "36/23",
        address: "용산동 313-77",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-07-10",
        shared: true,
        manager: "정서연",
        status: "거래철회",
        type: "아파트",
        trade: "단기",
        price: "4억/115",
        property: "래미안서초",
        floor: "14동",
        unit: "1377",
        supply: "124/95",
        pyeong: "19/52",
        households: "18/12",
        address: "송파동 459-78",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-09-09",
        shared: true,
        manager: "정선혜",
        status: "거래철회",
        type: "주상복합",
        trade: "전세",
        price: "11억",
        property: "래미안용산",
        floor: "17동",
        unit: "200",
        supply: "108/45",
        pyeong: "15/53",
        households: "35/20",
        address: "용산동 46-15",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-10-23",
        shared: true,
        manager: "정윤식",
        status: "거래가능",
        type: "빌라/연립",
        trade: "단기",
        price: "7억/182",
        property: "래미안용산",
        floor: "22동",
        unit: "404",
        supply: "194/149",
        pyeong: "39/38",
        households: "12/18",
        address: "마포동 805-34",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-07-17",
        shared: false,
        manager: "송영주",
        status: "거래철회",
        type: "오피스텔",
        trade: "매매",
        price: "28억",
        property: "래미안강남",
        floor: "17동",
        unit: "242",
        supply: "96/89",
        pyeong: "51/13",
        households: "10/35",
        address: "서초동 4-17",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-12-25",
        shared: false,
        manager: "박소현",
        status: "거래가능",
        type: "오피스텔",
        trade: "월세/렌트",
        price: "5억/285",
        property: "래미안송파",
        floor: "19동",
        unit: "1805",
        supply: "129/124",
        pyeong: "20/25",
        households: "33/33",
        address: "강남동 103-57",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2025-04-26",
        shared: false,
        manager: "정연서",
        status: "거래보류",
        type: "오피스텔",
        trade: "월세/렌트",
        price: "7억/347",
        property: "래미안서초",
        floor: "12동",
        unit: "883",
        supply: "192/154",
        pyeong: "19/20",
        households: "7/10",
        address: "용산동 747-16",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-09-14",
        shared: false,
        manager: "김규민",
        status: "거래완료",
        type: "주상복합",
        trade: "단기",
        price: "3억/300",
        property: "래미안용산",
        floor: "11동",
        unit: "1597",
        supply: "166/51",
        pyeong: "39/26",
        households: "12/26",
        address: "용산동 985-37",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-11-29",
        shared: true,
        manager: "하상현",
        status: "거래완료",
        type: "오피스텔",
        trade: "월세/렌트",
        price: "9억/344",
        property: "래미안서초",
        floor: "49동",
        unit: "1271",
        supply: "197/172",
        pyeong: "43/51",
        households: "47/39",
        address: "강남동 203-48",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    },
    {
        date: "2024-12-27",
        shared: false,
        manager: "박소현",
        status: "거래완료",
        type: "아파트",
        trade: "월세/렌트",
        price: "8억/479",
        property: "래미안강남",
        floor: "18동",
        unit: "487",
        supply: "144/82",
        pyeong: "28/54",
        households: "40/20",
        address: "마포동 511-85",
        reason: "",
        memo: "협의 가능",
        special: "깨끗한 상태"
    }
];
*/

// 전역 변수
let currentData = [];
let sortDirection = 'desc'; // 기본 정렬: 최신순 (내림차순)
let sortColumn = 'date';

// Supabase 초기화 대기
async function waitForSupabase() {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (window.supabaseClient) {
                clearInterval(checkInterval);
                console.log('Supabase 클라이언트 연결 확인');
                resolve();
            }
        }, 100);
        
        // 5초 후 타임아웃
        setTimeout(() => {
            clearInterval(checkInterval);
            console.log('Supabase 연결 타임아웃');
            resolve();
        }, 5000);
    });
}

// Supabase에서 데이터 로드
async function loadStoredData() {
    console.log('데이터 로드 시작...');
    
    // Supabase 연결 확인
    if (window.supabaseClient && window.getProperties) {
        try {
            console.log('Supabase에서 데이터 로드 중...');
            const { data, error, count } = await window.getProperties(); // 전체 데이터 로드 (limit=null)
            
            if (error) {
                console.error('Supabase 로드 오류:', error);
                // 오류 시 빈 배열 사용
                currentData = [];
            } else {
                console.log(`Supabase에서 ${data.length}개 매물 로드 완료`);
                // Supabase 데이터를 UI 형식으로 변환
                currentData = data.map(transformSupabaseToUI);
            }
        } catch (err) {
            console.error('데이터 로드 실패:', err);
            currentData = [];
        }
    } else {
        console.log('Supabase 연결 없음 - 빈 데이터 사용');
        currentData = [];
    }
    
    // 전역 접근을 위해 window 객체에 추가
    window.currentData = currentData;
    
    // 등록일 기준 최신순 정렬
    currentData.sort((a, b) => {
        const dateA = new Date(a.date || a.register_date);
        const dateB = new Date(b.date || b.register_date);
        return dateB - dateA; // 내림차순 (최신순)
    });
}

// Supabase 데이터를 UI 형식으로 변환
function transformSupabaseToUI(property) {
    // 날짜 포맷 변환 함수
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date)) return '';
            return date.toISOString().split('T')[0];
        } catch {
            return '';
        }
    };
    
    // households 값 생성 (층수 정보)
    let households = '';
    if (property.floor_current || property.floor_total) {
        households = `${property.floor_current || ''}/${property.floor_total || ''}`;
    }
    
    return {
        id: property.id,
        property_number: property.property_number || '',
        date: formatDate(property.register_date),
        shared: property.shared || false,
        manager: property.manager || '',
        status: property.status || '거래가능',
        type: property.property_type || '',
        trade: property.trade_type || '',
        price: property.price || '',
        property: property.property_name || '',
        floor: property.dong || '',
        unit: property.ho || '',
        supply: property.supply_area_sqm || '',
        pyeong: property.supply_area_pyeong || '',
        households: households,
        address: property.address || '',
        reason: property.re_register_reason || '',
        memo: property.manager_memo || '',
        special: property.special_notes || '',
        owner: property.owner_name || '',
        ownerContact: property.owner_contact || '',
        contactRelation: property.contact_relation || '',
        moveInDate: formatDate(property.move_in_date),
        approvalDate: formatDate(property.approval_date),
        management: property.management_fee || '',
        parking: property.parking || '',
        direction: property.direction || '',
        rooms: property.rooms || '',
        // 추가 필드들
        completion_date: formatDate(property.completion_date),
        resident: property.resident || '',
        rent_type: property.rent_type || '',
        rent_amount: property.rent_amount || '',
        contract_period: property.contract_period || '',
        has_photo: property.has_photo || false,
        has_video: property.has_video || false,
        has_appearance: property.has_appearance || false,
        joint_brokerage: property.joint_brokerage || '',
        joint_contact: property.joint_contact || '',
        ad_status: property.ad_status || '',
        ad_period: property.ad_period || '',
        registration_number: property.registration_number || ''
    };
}

// 페이지네이션 변수
let currentPage = 1;
// 반응형 페이지당 항목 수
function getItemsPerPage() {
    return window.innerWidth <= 768 ? 30 : 50;
}

let totalPages = 1;

// 테이블 렌더링 (페이지네이션 포함)
function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    // 테이블 렌더링 후 헤더 위치 조정
    setTimeout(() => {
        if (typeof adjustTableHeaderPosition === 'function') {
            adjustTableHeaderPosition();
        }
    }, 100);

    // 전체 데이터 수 업데이트
    const totalItems = data.length;
    const itemsPerPage = getItemsPerPage();
    totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // 현재 페이지가 총 페이지를 초과하면 마지막 페이지로
    if (currentPage > totalPages) {
        currentPage = totalPages || 1;
    }
    
    // 현재 페이지에 표시할 데이터
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = data.slice(startIndex, endIndex);

    // 페이지 데이터 렌더링
    pageData.forEach(row => {
        const tr = document.createElement('tr');
        
        const isAdmin = isAdminLoggedIn();
        
        const adminColumns = isAdmin ? `
            <td class="admin-only" style="font-size: 10px;">${row.owner || '-'}</td>
            <td class="admin-only" style="font-size: 10px;">${row.ownerContact || '-'}</td>
            <td class="admin-only" style="font-size: 10px;">${row.contactRelation || '-'}</td>
            <td class="admin-only" style="font-size: 9px; max-width: 100px; overflow: hidden; text-overflow: ellipsis;">${(row.special || '-').substring(0, 20)}</td>
            <td class="admin-only" style="font-size: 9px; max-width: 100px; overflow: hidden; text-overflow: ellipsis;">${(row.memo || '-').substring(0, 20)}</td>
            <td style="min-width: 80px;">
                <button class="btn-edit" onclick="event.stopPropagation(); editProperty('${row.id}');" title="수정">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="btn-delete" onclick="event.stopPropagation(); deleteProperty('${row.id}');" title="삭제">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                </button>
            </td>
        ` : `
            <td class="admin-only" style="display: none;"></td>
            <td class="admin-only" style="display: none;"></td>
            <td class="admin-only" style="display: none;"></td>
            <td class="admin-only" style="display: none;"></td>
            <td class="admin-only" style="display: none;"></td>
            <td style="display: none;"></td>
        `;
        
        tr.innerHTML = `
            <td>${row.date}</td>
            <td>${row.property_number || '-'}</td>
            <td><span class="status-${getStatusClass(row.status)}">${row.status}</span></td>
            <td><span class="type-${getTypeClass(row.type)}">${row.type}</span></td>
            <td><span class="trade-${getTradeClass(row.trade)}">${row.trade}</span></td>
            <td>${row.price}</td>
            <td>${row.property}</td>
            <td>${row.address || '-'}</td>
            <td>${row.floor || '-'}</td>
            <td>${row.unit || '-'}</td>
            <td>${row.supply || '-'}</td>
            <td>${row.pyeong || '-'}</td>
            <td>${row.households || '-'}</td>
            <td>${row.shared ? '<span class="checkmark">✓</span>' : ''}</td>
            <td>${row.manager}</td>
            ${adminColumns}
        `;
        
        // 데이터 속성에 ID 저장
        tr.setAttribute('data-id', row.id);

        tbody.appendChild(tr);
    });
    
    // 테이블 렌더링 후 클릭 이벤트 다시 추가
    addRowClickEvents();
    
    // 페이지네이션 업데이트
    updatePagination(totalItems);
}


// 페이지네이션 UI 업데이트
function updatePagination(totalItems) {
    // 현재 표시 건수 계산
    const itemsPerPage = getItemsPerPage();
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalItems);
    
    // 전체 건수와 현재 표시 건수 표시
    const paginationInfo = document.getElementById('paginationInfo');
    if (totalItems === 0) {
        paginationInfo.textContent = '데이터가 없습니다';
    } else {
        paginationInfo.textContent = `${startIndex}-${endIndex} / 전체 ${totalItems}건`;
    }
    
    // 페이지 번호 표시
    const paginationNumbers = document.getElementById('paginationNumbers');
    paginationNumbers.innerHTML = '';
    
    // 표시할 페이지 범위 계산 (최대 5개)
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'page-number';
        pageBtn.textContent = i;
        if (i === currentPage) {
            pageBtn.classList.add('active');
        }
        pageBtn.onclick = () => goToPage(i);
        paginationNumbers.appendChild(pageBtn);
    }
    
    // 이전/다음 버튼 활성화 상태
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages || totalPages === 0;
}

// 페이지 이동
function goToPage(page) {
    currentPage = page;
    renderTable(filteredData.length > 0 ? filteredData : currentData);
}

// 페이지 변경
function changePage(direction) {
    const newPage = currentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        goToPage(newPage);
    }
}

// CSS 클래스 생성 헬퍼 함수들
function getStatusClass(status) {
    if (status.includes('완료')) return '완료';
    if (status.includes('가능')) return '가능';
    if (status.includes('확인')) return '검토';
    return '검토';
}

function getTypeClass(type) {
    if (type === '아파트') return '아파트';
    if (type === '빌라/연립') return '빌라연립';
    if (type === '오피스텔') return '오피스텔';
    if (type === '타운하우스') return '단독주택';
    if (type === '상가') return '오피스텔';
    return '단독주택';
}

function getTradeClass(trade) {
    if (trade === '매매') return '매매';
    if (trade === '전세') return '전세';
    if (trade === '월세') return '월세';
    if (trade === '렌트') return '월세';
    return '월세';
}

// 정렬 기능
function sortData(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'desc';
    }

    const dataToSort = filteredData.length > 0 ? filteredData : currentData;
    
    dataToSort.sort((a, b) => {
        let aValue = a[column];
        let bValue = b[column];

        if (column === 'date') {
            aValue = new Date(aValue);
            bValue = new Date(bValue);
        }

        if (aValue < bValue) {
            return sortDirection === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
    });

    renderTable(dataToSort);
    updateSortArrow();
}

// 정렬 토글 기능
function toggleSort() {
    sortData('date');
}

// 정렬 화살표 업데이트
function updateSortArrow() {
    const arrow = document.querySelector('.sort-arrow');
    arrow.textContent = sortDirection === 'asc' ? '↑' : '↓';
}

// 필터링 기능
let filteredData = [];
let activeFilters = {
    status: [],
    type: [],
    trade: []
};
let currentFilterType = null;

// 필터 메뉴 표시
function showFilterMenu(event, filterType) {
    event.stopPropagation();
    const menu = document.getElementById('filterMenu');
    const rect = event.currentTarget.getBoundingClientRect();
    
    // 메뉴 위치 설정
    menu.style.left = rect.left + 'px';
    menu.style.top = (rect.bottom + 5) + 'px';
    menu.classList.add('show');
    
    currentFilterType = filterType;
    
    // 메뉴 옵션 생성
    populateFilterOptions(filterType);
    
    // 클릭 이벤트 리스너 추가 - 메뉴 외부 클릭 시에만 닫기
    setTimeout(() => {
        document.addEventListener('click', handleFilterMenuClick);
    }, 100);
}

// 필터 메뉴 클릭 처리
function handleFilterMenuClick(event) {
    const menu = document.getElementById('filterMenu');
    // 메뉴 내부 클릭인지 확인
    if (!menu.contains(event.target)) {
        closeFilterMenu();
    }
}

// 필터 메뉴 닫기
function closeFilterMenu() {
    const menu = document.getElementById('filterMenu');
    menu.classList.remove('show');
    document.removeEventListener('click', handleFilterMenuClick);
}

// 필터 옵션 생성
function populateFilterOptions(filterType) {
    const optionsContainer = document.getElementById('filterMenuOptions');
    optionsContainer.innerHTML = '';
    
    let options = [];
    
    // 미리 정의된 고정 옵션들
    if (filterType === 'status') {
        options = ['거래가능', '거래완료', '거래보류', '거래철회'];
    } else if (filterType === 'type') {
        options = [
            '아파트', '주상복합', '빌라/연립', '오피스텔', 
            '단독주택', '타운하우스', '빌딩/건물', '사무실/상가',
            '상가주택', '원룸', '다가구', '한옥', 
            '숙박/콘도', '전원/농가', '공장/창고', '재개발',
            '재건축', '아파트분양권', '주상복합분양권', '오피스텔분양권',
            '지식산업센터', '기타'
        ];
    } else if (filterType === 'trade') {
        options = ['분양', '매매', '전세', '월세/렌트', '단기'];
    }
    
    // 옵션 생성
    options.forEach(option => {
        if (option) {
            const div = document.createElement('div');
            div.className = 'filter-menu-option';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = option;
            checkbox.checked = activeFilters[filterType].includes(option);
            
            const label = document.createElement('label');
            label.textContent = option;
            label.style.flex = '1';
            label.style.cursor = 'pointer';
            
            div.appendChild(checkbox);
            div.appendChild(label);
            
            div.onclick = (e) => {
                if (e.target.tagName !== 'INPUT') {
                    checkbox.checked = !checkbox.checked;
                }
            };
            
            optionsContainer.appendChild(div);
        }
    });
}

// 필터 적용
function applyFilter() {
    const checkboxes = document.querySelectorAll('#filterMenuOptions input[type="checkbox"]:checked');
    activeFilters[currentFilterType] = Array.from(checkboxes).map(cb => cb.value);
    
    // 헤더에 필터 적용 표시
    updateFilterHeaders();
    
    // 필터 적용
    applyFilters();
    
    closeFilterMenu();
}

// 필터 초기화
function clearFilter() {
    activeFilters[currentFilterType] = [];
    const checkboxes = document.querySelectorAll('#filterMenuOptions input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
}

// 필터 헤더 업데이트
function updateFilterHeaders() {
    // 모든 필터 헤더 업데이트
    document.querySelectorAll('.filterable').forEach(th => {
        th.classList.remove('filtered');
    });
    
    if (activeFilters.status.length > 0) {
        document.querySelector('th[onclick*="status"]')?.classList.add('filtered');
    }
    if (activeFilters.type.length > 0) {
        document.querySelector('th[onclick*="type"]')?.classList.add('filtered');
    }
    if (activeFilters.trade.length > 0) {
        document.querySelector('th[onclick*="trade"]')?.classList.add('filtered');
    }
}

// 필터 메뉴 검색
function filterMenuSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const options = document.querySelectorAll('.filter-menu-option');
    
    options.forEach(option => {
        const text = option.textContent.toLowerCase();
        option.style.display = text.includes(searchTerm) ? 'flex' : 'none';
    });
}

// 필터 적용
function applyFilters() {
    const searchTerm = document.querySelector('.search-input')?.value.toLowerCase();
    
    filteredData = currentData.filter(item => {
        // 매물상태 필터
        if (activeFilters.status.length > 0 && !activeFilters.status.includes(item.status)) {
            return false;
        }
        
        // 매물종류 필터
        if (activeFilters.type.length > 0 && !activeFilters.type.includes(item.type)) {
            return false;
        }
        
        // 거래유형 필터
        if (activeFilters.trade.length > 0 && !activeFilters.trade.includes(item.trade)) {
            return false;
        }
        
        // 검색어 필터 (매물번호 포함)
        if (searchTerm) {
            const searchableText = `${item.property} ${item.address} ${item.manager} ${item.price} ${item.propertyNumber || ''}`.toLowerCase();
            if (!searchableText.includes(searchTerm)) {
                return false;
            }
        }
        
        return true;
    });
    
    currentPage = 1; // 필터 적용시 첫 페이지로
    renderTable(filteredData);
}

// 검색 기능
function searchProperties(event) {
    applyFilters();
}

// 필터 초기화 기능
function resetFilters() {
    // 모든 필터 초기화
    activeFilters = {
        status: [],
        type: [],
        trade: []
    };
    
    document.querySelector('.search-input').value = '';
    
    // 정렬도 초기 상태로 (최신순)
    sortDirection = 'desc';
    sortColumn = 'date';
    
    // 페이지도 첫 페이지로
    currentPage = 1;
    
    // 필터 헤더 초기화
    updateFilterHeaders();
    
    // 전체 데이터 표시
    filteredData = [...currentData];
    
    // 등록일 기준 최신순 정렬
    filteredData.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
    });
    
    renderTable(filteredData);
    updateSortArrow();
}

// 필터바 토글
function toggleFilterBar() {
    const filterLeft = document.querySelector('.filter-left');
    if (filterLeft) {
        if (filterLeft.style.display === 'none') {
            filterLeft.style.display = 'flex';
        } else {
            filterLeft.style.display = 'none';
        }
    }
}

// 모달 관련 함수들
function openModal(rowData) {
    const modal = document.getElementById('detailModal');
    const overlay = document.getElementById('overlay');
    
    // 모바일 체크
    const isMobile = window.innerWidth <= 1024;
    
    if (isMobile) {
        // 모바일: 모달 사용
        modal.classList.add('show');
        overlay.classList.add('show');
        
        // 모바일 핵심 정보 섹션 데이터 채우기
        document.getElementById('mobileProperty').textContent = rowData.property || '-';
        document.getElementById('mobilePrice').textContent = rowData.price || '-';
        document.getElementById('mobileTrade').textContent = rowData.trade || '-';
        document.getElementById('mobileStatus').textContent = rowData.status || '-';
        document.getElementById('mobileManager').textContent = rowData.manager || '-';
        document.getElementById('mobileRegisterDate').textContent = rowData.date || '-';
        
        // 모바일 상세 정보 섹션 데이터 채우기
        document.getElementById('mobileType').textContent = rowData.type || '-';
        document.getElementById('mobileShared').textContent = rowData.shared ? '공유' : '비공유';
        document.getElementById('mobileReason').textContent = rowData.reason || '-';
        document.getElementById('mobileDong').textContent = rowData.floor || '-';
        document.getElementById('mobileUnit').textContent = rowData.unit || '-';
        document.getElementById('mobileAddress').textContent = rowData.address || '-';
        document.getElementById('mobileDirection').textContent = '-';
        document.getElementById('mobileRooms').textContent = '-';
        document.getElementById('mobileFloorInfo').textContent = rowData.households || '-';
        document.getElementById('mobileContractPeriod').textContent = '-';
        document.getElementById('mobileCompletionDate').textContent = '-';
        document.getElementById('mobileSupplyArea').textContent = rowData.supply || '-';
        document.getElementById('mobileSupplyPyeong').textContent = rowData.pyeong || '-';
        document.getElementById('mobileDirection').textContent = rowData.direction || '-';
        document.getElementById('mobileRooms').textContent = rowData.rooms || '-';
        document.getElementById('mobileMemo').textContent = rowData.memo || '등록된 메모가 없습니다.';
        document.getElementById('mobileSpecial').textContent = rowData.special || '등록된 특이사항이 없습니다.';
        
        // 관리자 모드일 때 추가 정보 표시 (모바일)
        const isAdmin = isAdminLoggedIn();
        const mobileAdminSection = document.querySelector('.mobile-admin-only-section');
        
        if (mobileAdminSection) {
            mobileAdminSection.style.display = isAdmin ? 'block' : 'none';
            
            if (isAdmin) {
                // 관리자 전용 정보 채우기 (모바일)
                document.getElementById('mobileOwnerName').textContent = rowData.owner || '-';
                document.getElementById('mobileOwnerContact').textContent = rowData.ownerContact || '-';
                document.getElementById('mobileContactRelation').textContent = rowData.contactRelation || '-';
                document.getElementById('mobileMoveInDate').textContent = rowData.moveInDate || '-';
                document.getElementById('mobileApprovalDate').textContent = rowData.approvalDate || '-';
                document.getElementById('mobileManagement').textContent = rowData.management || '-';
                document.getElementById('mobileParking').textContent = rowData.parking || '-';
                document.getElementById('mobileDirectionDetail').textContent = rowData.direction || '-';
            }
        }
    } else {
        // 데스크톱: 사이드 패널 사용
        openSidePanel(rowData);
    }
}

function closeModal() {
    const modal = document.getElementById('detailModal');
    const overlay = document.getElementById('overlay');
    modal.classList.remove('show');
    overlay.classList.remove('show');
}

// 사이드 패널 관련 함수들 (데스크톱용)
function openSidePanel(rowData) {
    const sidePanel = document.getElementById('sidePanel');
    const overlay = document.getElementById('overlay');
    
    sidePanel.classList.add('show');
    overlay.classList.add('show');
    
    // 매물명 제목 설정
    document.getElementById('sidePropertyTitle').textContent = rowData.property || '매물 상세';
    
    // 핵심 정보
    document.getElementById('sidePrice').textContent = rowData.price || '-';
    document.getElementById('sideTrade').textContent = rowData.trade || '-';
    document.getElementById('sideStatus').textContent = rowData.status || '-';
    document.getElementById('sideManager').textContent = rowData.manager || '-';
    document.getElementById('sideRegisterDate').textContent = rowData.date || '-';
    
    // 기본 정보
    document.getElementById('sideType').textContent = rowData.type || '-';
    document.getElementById('sideShared').textContent = rowData.shared ? '공유' : '비공유';
    document.getElementById('sideReason').textContent = rowData.reason || '-';
    
    // 위치 및 구조
    document.getElementById('sideDong').textContent = rowData.floor || '-';
    document.getElementById('sideUnit').textContent = rowData.unit || '-';
    document.getElementById('sideAddress').textContent = rowData.address || '-';
    document.getElementById('sideDirection').textContent = '-';
    document.getElementById('sideRooms').textContent = '-';
    document.getElementById('sideFloorInfo').textContent = rowData.households || '-';
    
    // 거래 정보
    document.getElementById('sideContractPeriod').textContent = '-';
    document.getElementById('sideCompletionDate').textContent = '-';
    
    // 면적 정보
    document.getElementById('sideSupplyArea').textContent = rowData.supply || '-';
    document.getElementById('sideSupplyPyeong').textContent = rowData.pyeong || '-';
    
    // MEMO와 특이사항
    document.getElementById('sideMemoText').textContent = rowData.memo || '-';
    document.getElementById('sideSpecialText').textContent = rowData.special || '-';
    
    // 기타 필드들
    document.getElementById('sideDirection').textContent = rowData.direction || '-';
    document.getElementById('sideRooms').textContent = rowData.rooms || '-';
    
    // 관리자 모드일 때 추가 정보 표시
    const isAdmin = isAdminLoggedIn();
    const adminSection = document.querySelector('.admin-only-section');
    
    if (adminSection) {
        adminSection.style.display = isAdmin ? 'block' : 'none';
        
        if (isAdmin) {
            // 관리자 전용 정보 채우기
            document.getElementById('sideOwnerName').textContent = rowData.owner || '-';
            document.getElementById('sideOwnerContact').textContent = rowData.ownerContact || '-';
            document.getElementById('sideContactRelation').textContent = rowData.contactRelation || '-';
            document.getElementById('sideMoveInDate').textContent = rowData.moveInDate || '-';
            document.getElementById('sideApprovalDate').textContent = rowData.approvalDate || '-';
            document.getElementById('sideManagement').textContent = rowData.management || '-';
            document.getElementById('sideParking').textContent = rowData.parking || '-';
            document.getElementById('sideDirectionDetail').textContent = rowData.direction || '-';
        }
    }
    document.getElementById('sideRentType').textContent = rowData.rentType || '-';
    document.getElementById('sideResident').textContent = rowData.resident || '-';
    document.getElementById('sideCompletionDate').textContent = rowData.completionDate || '-';
    document.getElementById('sideAppearance').textContent = '-';
    document.getElementById('sideAdPeriod').textContent = '-';
}

function closeSidePanel() {
    const sidePanel = document.getElementById('sidePanel');
    const overlay = document.getElementById('overlay');
    sidePanel.classList.remove('show');
    overlay.classList.remove('show');
}

// 테이블 행 클릭 이벤트 추가
function addRowClickEvents() {
    const rows = document.querySelectorAll('#tableBody tr');
    rows.forEach(row => {
        let clickTimer = null;
        let clickCount = 0;
        
        // 클릭/더블클릭 처리를 위한 통합 이벤트 핸들러
        row.addEventListener('click', function(e) {
            clickCount++;
            
            if (clickCount === 1) {
                // 싱글 클릭 - 300ms 대기
                clickTimer = setTimeout(() => {
                    clickCount = 0;
                    // 싱글 클릭 처리 - 상세보기
                    const rowId = this.getAttribute('data-id');
                    const rowData = currentData.find(item => item.id == rowId);
                    if (rowData) {
                        openModal(rowData);
                    }
                }, 300);
            } else if (clickCount === 2) {
                // 더블 클릭
                clearTimeout(clickTimer);
                clickCount = 0;
                
                console.log('더블클릭 이벤트 발생');
                
                if (!isAdminLoggedIn()) {
                    alert('관리자만 매물을 수정할 수 있습니다.');
                    return;
                }
                
                const rowId = this.getAttribute('data-id');
                console.log('row data-id:', rowId);
                if (rowId) {
                    e.preventDefault();
                    e.stopPropagation();
                    editProperty(rowId);
                } else {
                    console.error('data-id 속성이 없습니다');
                }
            }
        });
    });
}

// 현재 매물 편집
function editCurrentProperty() {
    // 현재 열려있는 매물의 ID 가져오기
    const propertyTitle = document.getElementById('sidePanelTitle').textContent;
    const property = currentData.find(item => item.property === propertyTitle);
    if (property) {
        editProperty(property.id);
    }
}

// 댓글 관련 함수
let comments = [];

function showCommentInput() {
    const inputArea = document.querySelector('.comment-input-area');
    inputArea.style.display = 'block';
    document.getElementById('commentInput').focus();
}

function cancelComment() {
    const inputArea = document.querySelector('.comment-input-area');
    inputArea.style.display = 'none';
    document.getElementById('commentInput').value = '';
}

function submitComment() {
    const input = document.getElementById('commentInput');
    const text = input.value.trim();
    
    if (text) {
        const comment = {
            id: Date.now(),
            text: text,
            author: 'You',
            time: new Date().toLocaleString('ko-KR')
        };
        
        comments.push(comment);
        renderComments();
        cancelComment();
    }
}

function submitMobileComment() {
    const input = document.getElementById('mobileCommentInput');
    const text = input.value.trim();
    
    if (text) {
        const comment = {
            id: Date.now(),
            text: text,
            author: 'You',
            time: new Date().toLocaleString('ko-KR')
        };
        
        comments.push(comment);
        renderMobileComments();
        input.value = '';
    }
}

function renderComments() {
    const commentsList = document.getElementById('commentsList');
    const noComments = document.querySelector('.no-comments');
    
    if (comments.length === 0) {
        commentsList.innerHTML = '';
        noComments.style.display = 'inline';
    } else {
        noComments.style.display = 'none';
        commentsList.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <div class="user-avatar">${comment.author[0]}</div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${comment.author}</span>
                        <span class="comment-time">${comment.time}</span>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                </div>
            </div>
        `).join('');
    }
}

function renderMobileComments() {
    const commentsList = document.getElementById('mobileCommentsList');
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<p style="color: #9ca3af; text-align: center;">댓글이 없습니다.</p>';
    } else {
        commentsList.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <div class="user-avatar">${comment.author[0]}</div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${comment.author}</span>
                        <span class="comment-time">${comment.time}</span>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                </div>
            </div>
        `).join('');
    }
}

// 이벤트 리스너 설정
// 관리자 UI 업데이트 함수
function updateAdminUI() {
    const isAdmin = isAdminLoggedIn();
    
    // 관리자 컬럼 표시/숨김
    const adminColumn = document.getElementById('adminColumn');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    const adminOnlyColumns = document.querySelectorAll('.admin-only');
    
    if (adminColumn) {
        adminColumn.style.display = isAdmin ? 'table-cell' : 'none';
    }
    
    // 관리자 전용 테이블 컬럼들 표시/숨김
    adminOnlyColumns.forEach(column => {
        column.style.display = isAdmin ? 'table-cell' : 'none';
    });
    
    if (adminLogoutBtn) {
        adminLogoutBtn.style.display = isAdmin ? 'inline-block' : 'none';
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // Supabase 초기화 대기
    await waitForSupabase();
    
    // 데이터 로드
    await loadStoredData();
    
    // 삭제되지 않은 데이터만 필터링
    filteredData = currentData.filter(item => item.status !== '삭제됨');
    updateAdminUI(); // 관리자 UI 상태 업데이트
    renderTable(filteredData);

    // 정렬 이벤트
    document.querySelector('.sortable').addEventListener('click', () => sortData('date'));

    // 모달 닫기 이벤트
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // 오버레이 클릭시 닫기
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.addEventListener('click', function() {
            closeModal();
            closeSidePanel();
        });
    }

    // 댓글 헤더 클릭 이벤트
    const commentsHeader = document.querySelector('.comments-header');
    if (commentsHeader) {
        commentsHeader.addEventListener('click', showCommentInput);
    }

    // ESC 키로 모달/패널 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
            closeSidePanel();
        }
    });
});
    // 화면 크기 변경 시 페이지네이션 재계산
    window.addEventListener('resize', function() {
        // 현재 필터된 데이터로 테이블 다시 렌더링
        const filteredData = applyAllFilters(sampleData);
        renderTable(filteredData);
    });
