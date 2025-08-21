// 관리자 기능 - 수정/삭제 관련

// 관리자 모드에서 테이블 행 생성
function generateAdminTableRow(property) {
    const isAdmin = sessionStorage.getItem('admin_logged_in') === 'true';
    
    let adminColumns = '';
    if (isAdmin) {
        // 관리자 전용 컬럼들
        adminColumns = `
            <td class="admin-only">${property.owner_name || '-'}</td>
            <td class="admin-only">${property.owner_phone || '-'}</td>
            <td class="admin-only">${property.contact_relationship || '-'}</td>
            <td class="admin-only">${property.special_notes || '-'}</td>
            <td class="admin-only">${property.manager_memo || '-'}</td>
            <td class="admin-actions">
                <button class="btn-edit" onclick="editProperty('${property.id}', event)" title="수정">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="btn-delete" onclick="deletePropertyConfirm('${property.id}', event)" title="삭제">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </td>
        `;
    }
    
    return `
        <tr onclick="showPropertyDetails('${property.id}')" style="cursor: pointer;">
            <td>${formatDate(property.register_date)}</td>
            <td>${property.property_number || '-'}</td>
            <td><span class="status-badge ${getStatusClass(property.status)}">${property.status || '-'}</span></td>
            <td>${property.property_type || '-'}</td>
            <td>${property.trade_type || '-'}</td>
            <td>${property.price || '-'}</td>
            <td>${property.property_name || '-'}</td>
            <td>${property.address || '-'}</td>
            <td>${property.dong || '-'}</td>
            <td>${property.ho || '-'}</td>
            <td>${property.supply_area_sqm || '-'}</td>
            <td>${property.supply_area_pyeong || '-'}</td>
            <td>${property.floor_current && property.floor_total ? `${property.floor_current}/${property.floor_total}` : '-'}</td>
            <td>${property.shared === true ? '공유' : property.shared === false ? '비공유' : '-'}</td>
            <td>${property.manager || '-'}</td>
            ${adminColumns}
        </tr>
    `;
}

// 매물 수정
function editProperty(propertyId, event) {
    if (event) {
        event.stopPropagation(); // 행 클릭 이벤트 전파 방지
    }
    
    // 관리자 권한 확인
    const isAdmin = sessionStorage.getItem('admin_logged_in') === 'true';
    if (!isAdmin) {
        alert('관리자만 매물을 수정할 수 있습니다.');
        return;
    }
    
    // 경로 처리 - 로컬과 GitHub Pages 모두 지원
    let basePath = '';
    if (window.location.pathname.includes('/The-realty_hasia/')) {
        basePath = '/The-realty_hasia/';
    } else if (window.location.pathname !== '/' && !window.location.pathname.endsWith('index.html')) {
        // 현재 파일이 있는 디렉토리 경로 유지
        basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    }
    
    // 수정 페이지로 이동
    const targetUrl = `${basePath}form.html?id=${propertyId}`;
    console.log('수정 페이지로 이동:', targetUrl);
    window.location.href = targetUrl;
}

// 매물 삭제 확인
function deletePropertyConfirm(propertyId, event) {
    if (event) {
        event.stopPropagation(); // 행 클릭 이벤트 전파 방지
    }
    
    // 삭제 확인 다이얼로그
    const confirmDelete = confirm('정말로 이 매물을 삭제하시겠습니까?\n\n삭제된 매물은 휴지통에서 복구할 수 있습니다.');
    
    if (confirmDelete) {
        performDelete(propertyId);
    }
}

// 실제 삭제 수행
async function performDelete(propertyId) {
    try {
        // 로딩 표시
        showLoadingOverlay('매물 삭제 중...');
        
        // 소프트 삭제 수행
        const result = await window.deleteProperty(propertyId);
        
        if (result.success) {
            // 성공 메시지
            showNotification('매물이 삭제되었습니다.', 'success');
            
            // 목록 새로고침
            await loadProperties();
        } else {
            // 오류 메시지
            showNotification('삭제 중 오류가 발생했습니다: ' + result.error.message, 'error');
        }
    } catch (error) {
        console.error('삭제 오류:', error);
        showNotification('삭제 중 오류가 발생했습니다.', 'error');
    } finally {
        hideLoadingOverlay();
    }
}

// 삭제된 매물 복구
async function restorePropertyConfirm(propertyId) {
    const confirmRestore = confirm('이 매물을 복구하시겠습니까?');
    
    if (confirmRestore) {
        try {
            showLoadingOverlay('매물 복구 중...');
            
            const result = await window.restoreProperty(propertyId);
            
            if (result.success) {
                showNotification('매물이 복구되었습니다.', 'success');
                await loadDeletedProperties(); // 삭제된 매물 목록 새로고침
            } else {
                showNotification('복구 중 오류가 발생했습니다: ' + result.error.message, 'error');
            }
        } catch (error) {
            console.error('복구 오류:', error);
            showNotification('복구 중 오류가 발생했습니다.', 'error');
        } finally {
            hideLoadingOverlay();
        }
    }
}

// 매물 영구 삭제
async function permanentlyDeleteConfirm(propertyId) {
    const confirmDelete = confirm('⚠️ 경고: 이 작업은 되돌릴 수 없습니다!\n\n정말로 이 매물을 영구적으로 삭제하시겠습니까?');
    
    if (confirmDelete) {
        const doubleConfirm = confirm('마지막 확인: 이 매물의 모든 데이터가 완전히 삭제됩니다. 계속하시겠습니까?');
        
        if (doubleConfirm) {
            try {
                showLoadingOverlay('매물 영구 삭제 중...');
                
                const result = await window.permanentlyDeleteProperty(propertyId);
                
                if (result.success) {
                    showNotification('매물이 영구적으로 삭제되었습니다.', 'success');
                    await loadDeletedProperties(); // 삭제된 매물 목록 새로고침
                } else {
                    showNotification('영구 삭제 중 오류가 발생했습니다: ' + result.error.message, 'error');
                }
            } catch (error) {
                console.error('영구 삭제 오류:', error);
                showNotification('영구 삭제 중 오류가 발생했습니다.', 'error');
            } finally {
                hideLoadingOverlay();
            }
        }
    }
}

// 삭제된 매물 목록 로드
async function loadDeletedProperties() {
    try {
        showLoadingOverlay('삭제된 매물 로드 중...');
        
        const result = await window.getDeletedProperties();
        
        if (result.success) {
            displayDeletedProperties(result.data);
        } else {
            showNotification('삭제된 매물을 불러올 수 없습니다.', 'error');
        }
    } catch (error) {
        console.error('삭제된 매물 로드 오류:', error);
        showNotification('삭제된 매물을 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
        hideLoadingOverlay();
    }
}

// 삭제된 매물 목록 표시
function displayDeletedProperties(properties) {
    const container = document.getElementById('deletedPropertiesContainer');
    
    if (!container) return;
    
    if (!properties || properties.length === 0) {
        container.innerHTML = '<p>삭제된 매물이 없습니다.</p>';
        return;
    }
    
    container.innerHTML = `
        <table class="deleted-properties-table">
            <thead>
                <tr>
                    <th>삭제일</th>
                    <th>매물번호</th>
                    <th>매물명</th>
                    <th>담당자</th>
                    <th>상태</th>
                    <th>작업</th>
                </tr>
            </thead>
            <tbody>
                ${properties.map(property => `
                    <tr>
                        <td>${formatDate(property.deleted_at)}</td>
                        <td>${property.property_number || '-'}</td>
                        <td>${property.property_name || '-'}</td>
                        <td>${property.manager || '-'}</td>
                        <td>${property.status || '-'}</td>
                        <td>
                            <button class="btn-restore" onclick="restorePropertyConfirm('${property.id}')" title="복구">
                                복구
                            </button>
                            <button class="btn-permanent-delete" onclick="permanentlyDeleteConfirm('${property.id}')" title="영구삭제">
                                영구삭제
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// 로딩 오버레이 표시
function showLoadingOverlay(message = '처리 중...') {
    let overlay = document.getElementById('loadingOverlay');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'loading-overlay';
        document.body.appendChild(overlay);
    }
    
    overlay.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <p>${message}</p>
        </div>
    `;
    
    overlay.style.display = 'flex';
}

// 로딩 오버레이 숨기기
function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// 알림 표시
function showNotification(message, type = 'info') {
    let notification = document.getElementById('notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.display = 'block';
    
    // 3초 후 자동 숨김
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// 전역 함수로 노출
window.generateAdminTableRow = generateAdminTableRow;
window.editProperty = editProperty;
window.deletePropertyConfirm = deletePropertyConfirm;
window.restorePropertyConfirm = restorePropertyConfirm;
window.permanentlyDeleteConfirm = permanentlyDeleteConfirm;
window.loadDeletedProperties = loadDeletedProperties;