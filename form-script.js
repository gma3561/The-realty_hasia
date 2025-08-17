// 폼 데이터 관리
let formData = {};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
    loadFormData();
});

// 폼 초기화
function initializeForm() {
    // 오늘 날짜를 등록일 기본값으로 설정
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('registerDate').value = today;
    
    // URL 파라미터에서 편집할 데이터 ID 확인
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    
    if (editId) {
        loadPropertyData(editId);
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    const form = document.getElementById('propertyForm');
    
    // 실시간 유효성 검사
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearErrors);
    });
    
    // 면적 자동 계산
    document.getElementById('supplyArea').addEventListener('input', calculatePyeong);
    document.getElementById('supplyPyeong').addEventListener('input', calculateArea);
    
    // 폼 제출 방지
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveProperty();
    });
}

// 필드 유효성 검사
function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    // 기존 에러 메시지 제거
    clearFieldError(field);
    
    // 필수 필드 검사
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, '이 필드는 필수입니다.');
        return false;
    }
    
    // 이메일 형식 검사 (필요시)
    if (field.type === 'email' && value && !isValidEmail(value)) {
        showFieldError(field, '올바른 이메일 형식을 입력하세요.');
        return false;
    }
    
    // 숫자 필드 검사
    if (field.name === 'price' && value && !isValidPrice(value)) {
        showFieldError(field, '올바른 가격 형식을 입력하세요.');
        return false;
    }
    
    return true;
}

// 에러 표시
function showFieldError(field, message) {
    field.classList.add('invalid');
    
    let errorDiv = field.parentNode.querySelector('.error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        field.parentNode.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
}

// 에러 제거
function clearFieldError(field) {
    field.classList.remove('invalid');
    const errorDiv = field.parentNode.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// 모든 에러 제거
function clearErrors(e) {
    clearFieldError(e.target);
}

// 면적 단위 변환 (㎡ → 평)
function calculatePyeong() {
    const areaInput = document.getElementById('supplyArea');
    const pyeongInput = document.getElementById('supplyPyeong');
    const areaValue = areaInput.value;
    
    if (areaValue && areaValue.includes('/')) {
        const [supply, exclusive] = areaValue.split('/');
        const supplyNum = parseFloat(supply);
        const exclusiveNum = parseFloat(exclusive);
        
        if (!isNaN(supplyNum) && !isNaN(exclusiveNum)) {
            const supplyPyeong = (supplyNum * 0.3025).toFixed(2);
            const exclusivePyeong = (exclusiveNum * 0.3025).toFixed(2);
            pyeongInput.value = `${supplyPyeong}/${exclusivePyeong}`;
        }
    }
}

// 면적 단위 변환 (평 → ㎡)
function calculateArea() {
    const areaInput = document.getElementById('supplyArea');
    const pyeongInput = document.getElementById('supplyPyeong');
    const pyeongValue = pyeongInput.value;
    
    if (pyeongValue && pyeongValue.includes('/')) {
        const [supply, exclusive] = pyeongValue.split('/');
        const supplyNum = parseFloat(supply);
        const exclusiveNum = parseFloat(exclusive);
        
        if (!isNaN(supplyNum) && !isNaN(exclusiveNum)) {
            const supplyArea = (supplyNum / 0.3025).toFixed(2);
            const exclusiveArea = (exclusiveNum / 0.3025).toFixed(2);
            areaInput.value = `${supplyArea}/${exclusiveArea}`;
        }
    }
}

// 유효성 검사 헬퍼 함수들
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPrice(price) {
    // 가격 형식: 숫자, 억, 만, /, 등 허용
    const priceRegex = /^[\d,억만원\/\s]+$/;
    return priceRegex.test(price);
}

// 폼 데이터 수집
function collectFormData() {
    const form = document.getElementById('propertyForm');
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value.trim();
    }
    
    return data;
}

// 폼 유효성 검사
function validateForm() {
    const form = document.getElementById('propertyForm');
    const inputs = form.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField({ target: input })) {
            isValid = false;
        }
    });
    
    return isValid;
}

// 매물 저장
function saveProperty() {
    if (!validateForm()) {
        showMessage('입력 정보를 확인해주세요.', 'error');
        return;
    }
    
    const data = collectFormData();
    
    // 로딩 상태 표시
    const form = document.getElementById('propertyForm');
    form.classList.add('loading');
    
    // 기존 데이터에서 ID 확인
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    
    if (editId) {
        // 수정 모드
        updateProperty(editId, data);
    } else {
        // 신규 등록 모드
        addNewProperty(data);
    }
}

// 새 매물 추가
function addNewProperty(data) {
    // 로컬 스토리지에서 기존 데이터 가져오기
    let properties = JSON.parse(localStorage.getItem('properties') || '[]');
    
    // 새 ID 생성
    const newId = Date.now().toString();
    data.id = newId;
    data.completed = false;
    
    // 데이터 변환 (테이블 형식에 맞게)
    const propertyData = {
        id: newId,
        date: data.registerDate,
        supplier: data.supplier || '-',
        manager: data.manager || '거래가능',
        status: data.status || '거래가능',
        type: data.propertyType || '아파트',
        trade: data.tradeType || '매매',
        price: data.price || '-',
        property: data.propertyName || '-',
        floor: data.floor || '-',
        unit: data.unit || '-',
        supply: data.supplyArea || '-',
        pyeong: data.supplyPyeong || '-',
        households: data.households || '-',
        completed: false
    };
    
    properties.unshift(propertyData);
    localStorage.setItem('properties', JSON.stringify(properties));
    
    setTimeout(() => {
        document.getElementById('propertyForm').classList.remove('loading');
        showMessage('매물이 성공적으로 등록되었습니다.', 'success');
        
        setTimeout(() => {
            goToList();
        }, 1500);
    }, 1000);
}

// 매물 수정
function updateProperty(id, data) {
    let properties = JSON.parse(localStorage.getItem('properties') || '[]');
    const index = properties.findIndex(p => p.id === id);
    
    if (index !== -1) {
        // 기존 데이터 업데이트
        const updatedProperty = {
            ...properties[index],
            date: data.registerDate,
            supplier: data.supplier || '-',
            manager: data.manager || '거래가능',
            status: data.status || '거래가능',
            type: data.propertyType || '아파트',
            trade: data.tradeType || '매매',
            price: data.price || '-',
            property: data.propertyName || '-',
            floor: data.floor || '-',
            unit: data.unit || '-',
            supply: data.supplyArea || '-',
            pyeong: data.supplyPyeong || '-',
            households: data.households || '-'
        };
        
        properties[index] = updatedProperty;
        localStorage.setItem('properties', JSON.stringify(properties));
        
        setTimeout(() => {
            document.getElementById('propertyForm').classList.remove('loading');
            showMessage('매물이 성공적으로 수정되었습니다.', 'success');
            
            setTimeout(() => {
                goToList();
            }, 1500);
        }, 1000);
    }
}

// 기존 매물 데이터 로드 (편집용)
function loadPropertyData(id) {
    const properties = JSON.parse(localStorage.getItem('properties') || '[]');
    const property = properties.find(p => p.id === id);
    
    if (property) {
        // 폼에 데이터 채우기
        document.getElementById('registerDate').value = property.date;
        document.getElementById('supplier').value = property.supplier !== '-' ? property.supplier : '';
        document.getElementById('manager').value = property.manager;
        document.getElementById('status').value = property.status;
        document.getElementById('propertyType').value = property.type;
        document.getElementById('tradeType').value = property.trade;
        document.getElementById('price').value = property.price !== '-' ? property.price : '';
        document.getElementById('propertyName').value = property.property !== '-' ? property.property : '';
        document.getElementById('floor').value = property.floor !== '-' ? property.floor : '';
        document.getElementById('unit').value = property.unit !== '-' ? property.unit : '';
        document.getElementById('supplyArea').value = property.supply !== '-' ? property.supply : '';
        document.getElementById('supplyPyeong').value = property.pyeong !== '-' ? property.pyeong : '';
        document.getElementById('households').value = property.households !== '-' ? property.households : '';
        
        // 헤더 제목 변경
        document.querySelector('h1').textContent = '더부동산 매물수정';
    }
}

// 목록으로 이동
function goToList() {
    window.location.href = 'index.html';
}

// 메시지 표시
function showMessage(message, type = 'success') {
    // 기존 메시지 제거
    const existingMessage = document.querySelector('.success-message, .error-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.textContent = message;
    
    const formContainer = document.querySelector('.form-container');
    formContainer.insertBefore(messageDiv, formContainer.firstChild);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 3000);
}

// 폼 데이터 임시 저장/복원
function saveFormData() {
    const data = collectFormData();
    localStorage.setItem('tempFormData', JSON.stringify(data));
}

function loadFormData() {
    const tempData = localStorage.getItem('tempFormData');
    if (tempData) {
        const data = JSON.parse(tempData);
        
        Object.keys(data).forEach(key => {
            const field = document.querySelector(`[name="${key}"]`);
            if (field && data[key]) {
                field.value = data[key];
            }
        });
        
        // 임시 데이터 삭제
        localStorage.removeItem('tempFormData');
    }
}

// 페이지 나가기 전 데이터 저장
window.addEventListener('beforeunload', function() {
    const form = document.getElementById('propertyForm');
    const hasData = Array.from(form.elements).some(element => 
        element.value && element.value.trim() !== ''
    );
    
    if (hasData) {
        saveFormData();
    }
});