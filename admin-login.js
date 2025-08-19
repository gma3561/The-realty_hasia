// 관리자 로그인/로그아웃 관련 함수

// 관리자 로그인 후 UI 업데이트
function updateAdminUI() {
    const isAdmin = sessionStorage.getItem('admin_logged_in') === 'true';
    
    // 관리자 컬럼 표시/숨기기
    const adminColumn = document.getElementById('adminColumn');
    const adminOnlyElements = document.querySelectorAll('.admin-only');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    
    if (isAdmin) {
        // 관리자 모드 활성화
        if (adminColumn) adminColumn.style.display = '';
        adminOnlyElements.forEach(el => el.style.display = '');
        if (adminLogoutBtn) adminLogoutBtn.style.display = '';
        
        console.log('관리자 UI 활성화');
    } else {
        // 일반 사용자 모드
        if (adminColumn) adminColumn.style.display = 'none';
        adminOnlyElements.forEach(el => el.style.display = 'none');
        if (adminLogoutBtn) adminLogoutBtn.style.display = 'none';
        
        console.log('관리자 UI 비활성화');
    }
    
    // 테이블 데이터 다시 렌더링
    if (window.currentProperties && window.displayProperties) {
        window.displayProperties(window.currentProperties);
    }
}

// 관리자 로그아웃
function adminLogout() {
    sessionStorage.removeItem('admin_logged_in');
    updateAdminUI();
    if (window.loadProperties) {
        window.loadProperties();
    }
    console.log('관리자 로그아웃 완료');
}

// 페이지 로드 시 관리자 상태 확인
document.addEventListener('DOMContentLoaded', function() {
    // 초기 UI 설정
    setTimeout(() => {
        updateAdminUI();
    }, 100);
});

// 전역 함수로 노출
window.updateAdminUI = updateAdminUI;
window.adminLogout = adminLogout;