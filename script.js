// 매물등록 페이지로 이동
function goToForm() {
    window.location.href = 'form.html';
}

// 매물 편집 페이지로 이동
function editProperty(id) {
    window.location.href = `form.html?edit=${id}`;
}

// 실제 데이터 (CSV에서 가져온 데이터)
const sampleData = [
    {
        date: '2021-12-29',
        shared: false,
        manager: '박소현',
        status: '확인필요',
        type: '아파트',
        trade: '매매',
        price: '17억 (갭투자)',
        property: '장자울아파트',
        floor: '',
        unit: '303',
        supply: '-/-',
        pyeong: '32/-',
        households: '-/-',
        address: '신사동 593-21',
        reason: '확인필요',
        memo: '갭투자 가능',
        special: '3/2개, 1대무료 유료가능'
    },
    {
        date: '2021-12-29',
        shared: false,
        manager: '박소현',
        status: '거래가능',
        type: '아파트',
        trade: '월세',
        price: '2억/800',
        property: '브라운스톤로얄스위트논현',
        floor: '',
        unit: '304',
        supply: '-/-',
        pyeong: '74/-',
        households: '-/-',
        address: '논현동 43-3',
        memo: '',
        special: '4/3개, 2대, 주인거주 협의'
    },
    {
        date: '2021-12-30',
        shared: false,
        manager: '박소현',
        status: '거래완료',
        type: '아파트',
        trade: '월세',
        price: '1억/650',
        property: '한남 트윈빌',
        floor: 'B',
        unit: '',
        supply: '-/-',
        pyeong: '41/-',
        households: '1층/-',
        address: '한남동 26-10',
        memo: '현재 세입자 있음',
        special: '4/2개, 2대, 2월 말 협의'
    },
    {
        date: '2022-01-04',
        shared: false,
        manager: '박소현',
        status: '확인필요',
        type: '빌라/연립',
        trade: '전세',
        price: '-',
        property: '우림빌라',
        floor: 'A',
        unit: '2',
        supply: '-/-',
        pyeong: '39/-',
        households: '-/-',
        address: '-',
        memo: '임차인, 한남동11-295',
        special: '3/2개, 1대, 거실 한강뷰'
    },
    {
        date: '2022-01-05',
        shared: false,
        manager: '박소현',
        status: '거래완료',
        type: '빌라/연립',
        trade: '렌트',
        price: '3,000/850',
        property: '피치빌 정원세대',
        floor: '',
        unit: '101',
        supply: '-/-',
        pyeong: '61/-',
        households: '-/-',
        address: '한남동 1-238',
        reason: '렌트로 계약',
        memo: '',
        special: '3/3개, 2대, 즉시입주, 정원세대'
    },
    {
        date: '2022-01-09',
        shared: false,
        manager: '정윤식',
        status: '거래가능',
        type: '아파트',
        trade: '월세',
        price: '10억/2000',
        property: '르가든 더메인한남',
        floor: '',
        unit: '304',
        supply: '-/-',
        pyeong: '-/-',
        households: '3/6층',
        address: '한남동386',
        memo: '2월에 집볼수 있어요',
        special: '59대(세대당 3.68대), 2019.06.19'
    },
    {
        date: '2022-01-12',
        shared: true,
        manager: '정윤식',
        status: '거래가능',
        type: '오피스텔',
        trade: '매매',
        price: '60억',
        property: '시그니엘 70C',
        floor: '',
        unit: '46층',
        supply: '-/-',
        pyeong: '70평C타입/-',
        households: '46/123층',
        address: '신천동29',
        memo: '',
        special: '북서향, 즉시입주, 거의 사용하지 않은 새집'
    },
    {
        date: '2022-01-12',
        shared: false,
        manager: '박소현',
        status: '거래가능',
        type: '빌라/연립',
        trade: '매매',
        price: '40억',
        property: '수빌라',
        floor: '',
        unit: '201',
        supply: '-/-',
        pyeong: '-/-',
        households: '-/-',
        address: '한남동11-288번지',
        memo: '임차인, 전세 16억, 2022년 9월 만기',
        special: '3/2개, 2대, 올리모델링, 한강뷰, 재건축 예정'
    },
    {
        date: '2022-01-12',
        shared: false,
        manager: '대표매물',
        status: '거래가능',
        type: '아파트',
        trade: '전세',
        price: '15억',
        property: '브리앙뜨 3차',
        floor: '',
        unit: '402',
        supply: '149.17/137.49',
        pyeong: '45.12/41.59',
        households: '4/6층',
        address: '반포동 101-10',
        memo: '',
        special: '룸4/욕실2, 2대, 올 인테리어 컨디션 아주 좋음!!'
    },
    {
        date: '2022-01-12',
        shared: false,
        manager: '정윤식',
        status: '거래가능',
        type: '아파트',
        trade: '전세',
        price: '23억',
        property: '청담래미안 로이뷰',
        floor: '',
        unit: '15층세대',
        supply: '-/-',
        pyeong: '41/33',
        households: '15/16층',
        address: '청담동134',
        memo: '',
        special: '3/2, 3월23일 가능, 부분수리, 한강뷰세대'
    },
    {
        date: '2022-01-17',
        shared: false,
        manager: '박소현',
        status: '확인필요',
        type: '타운하우스',
        trade: '매매',
        price: '10억5,000',
        property: '플로렌스힐',
        floor: 'D',
        unit: '101',
        supply: '-/-',
        pyeong: '36.7/-',
        households: '-/-',
        address: '신촌동52-19',
        memo: '',
        special: '3/2개, 2대, 복층, 신축급, 정원테라스'
    },
    {
        date: '2022-01-20',
        shared: false,
        manager: '박소현',
        status: '확인필요',
        type: '빌라/연립',
        trade: '전세',
        price: '23억 (조정가능)',
        property: '파크뷰빌라',
        floor: '',
        unit: '205',
        supply: '-/-',
        pyeong: '65/-',
        households: '-/-',
        address: '한남동1-1',
        memo: '배우김수로 살고있음, 조용히 진행해달라고 함',
        special: ''
    },
    {
        date: '2022-01-26',
        shared: true,
        manager: '박소현',
        status: '거래가능',
        type: '아파트',
        trade: '렌트',
        price: '1,200',
        property: '방배포레빌 5층',
        floor: '',
        unit: '',
        supply: '-/-',
        pyeong: '70/-',
        households: '5층/-',
        address: '방배동845-5',
        memo: '현재공실',
        special: '4/3개, 48만원, 3대, 테라스4개, 서리풀공원뷰'
    },
    {
        date: '2022-02-08',
        shared: false,
        manager: '박소현',
        status: '확인필요',
        type: '빌라/연립',
        trade: '전세',
        price: '15억',
        property: '월드빌라 2층',
        floor: '',
        unit: '',
        supply: '-/-',
        pyeong: '40/-',
        households: '2층/-',
        address: '반포동577-78',
        memo: '소유주, 현재주인거주',
        special: '4/2개, 2대, 즉시입주, 올수리'
    },
    {
        date: '2022-02-09',
        shared: false,
        manager: '박소현',
        status: '확인필요',
        type: '아파트',
        trade: '전세',
        price: '10억150',
        property: '도곡지웰카운티',
        floor: '2',
        unit: '202',
        supply: '-/-',
        pyeong: '32/-',
        households: '-/-',
        address: '도곡동199-4번지',
        memo: '세입자 5월 만기',
        special: '3/2개, 2대'
    },
    {
        date: '2022-02-15',
        shared: false,
        manager: '박소현',
        status: '거래가능',
        type: '아파트',
        trade: '매매',
        price: '38억',
        property: '래미안갤러리',
        floor: '',
        unit: '1502',
        supply: '198/165',
        pyeong: '59.9/49.9',
        households: '15/20층',
        address: '청담동 142',
        memo: '',
        special: '4/3개, 남향, 한강뷰'
    },
    {
        date: '2022-02-20',
        shared: true,
        manager: '정윤식',
        status: '거래가능',
        type: '오피스텔',
        trade: '월세',
        price: '5억/500',
        property: '갤러리아포레',
        floor: '',
        unit: '2801',
        supply: '245/198',
        pyeong: '74.1/59.9',
        households: '28/35층',
        address: '압구정동 494',
        memo: '즉시입주가능',
        special: '3/2개, 서비스면적 포함'
    },
    {
        date: '2022-03-01',
        shared: false,
        manager: '박소현',
        status: '거래완료',
        type: '빌라/연립',
        trade: '매매',
        price: '28억',
        property: '한남더힐',
        floor: '',
        unit: '301',
        supply: '165/132',
        pyeong: '49.9/39.9',
        households: '3/4층',
        address: '한남동 810',
        memo: '거래완료',
        special: '3/2개, 테라스, 한강뷰'
    },
    {
        date: '2022-03-10',
        shared: false,
        manager: '정윤식',
        status: '거래가능',
        type: '아파트',
        trade: '전세',
        price: '18억',
        property: '아크로리버파크',
        floor: '',
        unit: '3205',
        supply: '114/84',
        pyeong: '34.5/25.4',
        households: '32/40층',
        address: '반포동 2-1',
        memo: '8월 입주가능',
        special: '3/2개, 한강뷰, 고층'
    },
    {
        date: '2022-03-15',
        shared: true,
        manager: '박소현',
        status: '거래가능',
        type: '타운하우스',
        trade: '매매',
        price: '45억',
        property: '나인원한남',
        floor: '',
        unit: 'A-101',
        supply: '273/220',
        pyeong: '82.6/66.6',
        households: '1/3층',
        address: '한남동 91',
        memo: '',
        special: '4/4개, 테라스, 전용엘리베이터'
    },
    {
        date: '2022-03-20',
        shared: false,
        manager: '박소현',
        status: '확인필요',
        type: '아파트',
        trade: '월세',
        price: '3억/1500',
        property: '반포자이',
        floor: '',
        unit: '105-2301',
        supply: '149/121',
        pyeong: '45.1/36.6',
        households: '23/35층',
        address: '반포동 20-43',
        memo: '협의가능',
        special: '4/2개, 남향, 한강조망'
    },
    {
        date: '2022-03-25',
        shared: false,
        manager: '정윤식',
        status: '거래가능',
        type: '오피스텔',
        trade: '전세',
        price: '7억5000',
        property: '트리마제',
        floor: '',
        unit: '1015',
        supply: '85/65',
        pyeong: '25.7/19.7',
        households: '10/20층',
        address: '신사동 544-28',
        memo: '',
        special: '2/1개, 즉시입주'
    },
    {
        date: '2022-04-01',
        shared: true,
        manager: '박소현',
        status: '거래가능',
        type: '아파트',
        trade: '매매',
        price: '52억',
        property: '한남리첸시아',
        floor: '',
        unit: '201',
        supply: '244/198',
        pyeong: '73.8/59.9',
        households: '2/18층',
        address: '한남동 723',
        memo: '',
        special: '4/3개, 한강뷰, 리모델링완료'
    },
    {
        date: '2022-04-05',
        shared: false,
        manager: '박소현',
        status: '거래완료',
        type: '빌라/연립',
        trade: '전세',
        price: '12억',
        property: '청담빌라',
        floor: '',
        unit: '102',
        supply: '132/105',
        pyeong: '39.9/31.8',
        households: '1/3층',
        address: '청담동 87-5',
        memo: '거래완료',
        special: '3/2개, 정원, 주차2대'
    },
    {
        date: '2022-04-10',
        shared: false,
        manager: '정윤식',
        status: '거래가능',
        type: '아파트',
        trade: '월세',
        price: '8억/800',
        property: '더펜트하우스청담',
        floor: '',
        unit: 'PH-A',
        supply: '330/265',
        pyeong: '99.8/80.1',
        households: '45/45층',
        address: '청담동 134-23',
        memo: '펜트하우스',
        special: '5/4개, 루프탑, 전용엘리베이터'
    },
    {
        date: '2022-04-15',
        shared: true,
        manager: '박소현',
        status: '거래가능',
        type: '상가',
        trade: '매매',
        price: '65억',
        property: '압구정로데오상가',
        floor: '1층',
        unit: '',
        supply: '165/165',
        pyeong: '49.9/49.9',
        households: '1/5층',
        address: '압구정동 445',
        memo: '로데오거리 코너',
        special: '권리금 별도, 현재 카페운영중'
    },
    {
        date: '2022-04-20',
        shared: false,
        manager: '정윤식',
        status: '거래가능',
        type: '아파트',
        trade: '전세',
        price: '25억',
        property: '한남더힐',
        floor: '',
        unit: '233-1802',
        supply: '244/198',
        pyeong: '73.8/59.9',
        households: '18/32층',
        address: '한남동 787',
        memo: '',
        special: '4/3개, 한강뷰, 풀옵션'
    },
    {
        date: '2022-04-25',
        shared: false,
        manager: '박소현',
        status: '확인필요',
        type: '빌라/연립',
        trade: '매매',
        price: '18억',
        property: '옥수하이츠빌라',
        floor: '',
        unit: '301',
        supply: '148/120',
        pyeong: '44.8/36.3',
        households: '3/4층',
        address: '옥수동 456',
        memo: '리모델링 예정',
        special: '4/2개, 한강인근, 주차1대'
    },
    {
        date: '2022-05-01',
        shared: true,
        manager: '정윤식',
        status: '거래가능',
        type: '오피스텔',
        trade: '월세',
        price: '2억/450',
        property: '청담자이',
        floor: '',
        unit: '807',
        supply: '59/45',
        pyeong: '17.8/13.6',
        households: '8/25층',
        address: '청담동 98',
        memo: '즉시입주',
        special: '1.5룸, 분리형원룸'
    },
    {
        date: '2022-05-05',
        shared: false,
        manager: '박소현',
        status: '거래완료',
        type: '아파트',
        trade: '매매',
        price: '42억',
        property: '반포아크로리버파크',
        floor: '',
        unit: '101-3502',
        supply: '166/130',
        pyeong: '50.2/39.3',
        households: '35/40층',
        address: '반포동 2-1',
        memo: '프리미엄 매물',
        special: '4/3개, 한강뷰, 신축'
    }
];

let currentData = [];
let sortDirection = 'desc'; // 기본 정렬: 최신순 (내림차순)
let sortColumn = 'date';

// 로컬 스토리지에서 데이터 로드
function loadStoredData() {
    // 강제로 새 데이터 로드 (캐시 클리어)
    localStorage.removeItem('properties');
    
    // 초기 샘플 데이터 설정
    currentData = [...sampleData];
    currentData.forEach((item, index) => {
        item.id = Date.now() + index;
    });
    
    // 등록일 기준 최신순 정렬
    currentData.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA; // 내림차순 (최신순)
    });
    
    localStorage.setItem('properties', JSON.stringify(currentData));
}

// 테이블 렌더링
function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    data.forEach(row => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${row.date}</td>
            <td>${row.propertyNumber || '-'}</td>
            <td>${row.shared ? '<span class="checkmark">✓</span>' : ''}</td>
            <td>${row.manager}</td>
            <td><span class="status-${getStatusClass(row.status)}">${row.status}</span></td>
            <td><span class="type-${getTypeClass(row.type)}">${row.type}</span></td>
            <td><span class="trade-${getTradeClass(row.trade)}">${row.trade}</span></td>
            <td>${row.price}</td>
            <td>${row.property}</td>
            <td>${row.floor || '-'}</td>
            <td>${row.unit || '-'}</td>
            <td>${row.supply || '-'}</td>
            <td>${row.pyeong || '-'}</td>
            <td>${row.households || '-'}</td>
        `;
        
        // 데이터 속성에 ID 저장
        tr.setAttribute('data-id', row.id);

        tbody.appendChild(tr);
    });
    
    // 테이블 렌더링 후 클릭 이벤트 다시 추가
    addRowClickEvents();
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

function applyFilters() {
    const propertyTypeFilter = document.getElementById('propertyTypeFilter')?.value;
    const tradeTypeFilter = document.getElementById('tradeTypeFilter')?.value;
    const statusFilter = document.getElementById('statusFilter')?.value;
    const searchTerm = document.querySelector('.search-input')?.value.toLowerCase();
    
    filteredData = currentData.filter(item => {
        // 매물종류 필터
        if (propertyTypeFilter && item.type !== propertyTypeFilter) {
            return false;
        }
        
        // 거래유형 필터
        if (tradeTypeFilter && !item.trade.includes(tradeTypeFilter)) {
            return false;
        }
        
        // 매물상태 필터
        if (statusFilter && item.status !== statusFilter) {
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
    
    renderTable(filteredData);
}

// 검색 기능
function searchProperties(event) {
    applyFilters();
}

// 필터 초기화 기능
function resetFilters() {
    // 모든 필터 초기화
    document.getElementById('propertyTypeFilter').value = '';
    document.getElementById('tradeTypeFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.querySelector('.search-input').value = '';
    
    // 정렬도 초기 상태로 (최신순)
    sortDirection = 'desc';
    sortColumn = 'date';
    
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
        
        // 모달에 데이터 채우기
        document.getElementById('modalTitle').textContent = rowData.property || '매물 상세 정보';
        document.getElementById('mobileShared').textContent = rowData.shared ? '공유' : '비공유';
        document.getElementById('mobileManager').textContent = rowData.manager || '-';
        document.getElementById('mobileStatus').textContent = rowData.status || '-';
        document.getElementById('mobileReason').textContent = rowData.reason || '-';
        document.getElementById('mobileType').textContent = rowData.type || '-';
        document.getElementById('mobileProperty').textContent = rowData.property || '-';
        document.getElementById('mobileDong').textContent = rowData.dong || '-';
        document.getElementById('mobileUnit').textContent = rowData.unit || '-';
        document.getElementById('mobileAddress').textContent = rowData.address || '-';
        document.getElementById('mobileDirection').textContent = rowData.direction || '-';
        document.getElementById('mobileRooms').textContent = rowData.rooms || '-';
        document.getElementById('mobileFloorInfo').textContent = rowData.floorInfo || rowData.households || '-';
        document.getElementById('mobileTrade').textContent = rowData.trade || '-';
        document.getElementById('mobilePrice').textContent = rowData.price || '-';
        document.getElementById('mobileContractPeriod').textContent = rowData.contractPeriod || '-';
        document.getElementById('mobileCompletionDate').textContent = rowData.completionDate || '-';
        document.getElementById('mobileSupplyArea').textContent = rowData.supply || '-';
        document.getElementById('mobileSupplyPyeong').textContent = rowData.pyeong || '-';
        document.getElementById('mobileMemo').textContent = rowData.memo || '등록된 메모가 없습니다.';
        document.getElementById('mobileSpecial').textContent = rowData.special || '등록된 특이사항이 없습니다.';
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
    
    // 사이드 패널에 데이터 채우기
    document.getElementById('sidePanelTitle').textContent = rowData.property || '매물 상세 정보';
    document.getElementById('sideShared').textContent = rowData.shared ? '공유' : '비공유';
    document.getElementById('sideManager').textContent = rowData.manager || '-';
    document.getElementById('sideStatus').textContent = rowData.status || '-';
    document.getElementById('sideReason').textContent = rowData.reason || '-';
    document.getElementById('sideType').textContent = rowData.type || '-';
    document.getElementById('sideProperty').textContent = rowData.property || '-';
    document.getElementById('sideDong').textContent = rowData.dong || rowData.floor || '-';
    document.getElementById('sideUnit').textContent = rowData.unit || '-';
    document.getElementById('sideAddress').textContent = rowData.address || '-';
    document.getElementById('sideTrade').textContent = rowData.trade || '-';
    document.getElementById('sidePrice').textContent = rowData.price || '-';
    document.getElementById('sideSupplyArea').textContent = rowData.supply || '-';
    document.getElementById('sideSupplyPyeong').textContent = rowData.pyeong || '-';
    document.getElementById('sideFloorInfo').textContent = rowData.households || '-';
    document.getElementById('sideDirection').textContent = rowData.direction || '-';
    document.getElementById('sideRooms').textContent = rowData.rooms || '-';
    document.getElementById('sideParking').textContent = rowData.parking || '-';
    document.getElementById('sideManagementFee').textContent = rowData.managementFee || '-';
    document.getElementById('sideMoveInDate').textContent = rowData.moveInDate || '-';
    document.getElementById('sideApprovalDate').textContent = rowData.approvalDate || '-';
    document.getElementById('sideRegisterDate').textContent = rowData.date || '-';
    document.getElementById('sideMemo').innerHTML = rowData.memo ? rowData.memo.replace(/\n/g, '<br>') : '등록된 메모가 없습니다.';
    document.getElementById('sideSpecial').innerHTML = rowData.special ? rowData.special.replace(/\n/g, '<br>') : '등록된 특이사항이 없습니다.';
    
    // 기타 필드들
    document.getElementById('sideAdStatus').textContent = '-';
    document.getElementById('sideSharedContact').textContent = '-';
    document.getElementById('sideSharedBrokerage').textContent = '-';
    document.getElementById('sideVideo').textContent = '-';
    document.getElementById('sidePhoto').textContent = '-';
    document.getElementById('sideContractPeriod').textContent = rowData.contractPeriod || '-';
    document.getElementById('sideRentAmount').textContent = rowData.rentAmount || '-';
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
        row.addEventListener('click', function() {
            const rowId = this.getAttribute('data-id');
            const rowData = currentData.find(item => item.id == rowId);
            if (rowData) {
                openModal(rowData);
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
document.addEventListener('DOMContentLoaded', function() {
    loadStoredData();
    filteredData = [...currentData];
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