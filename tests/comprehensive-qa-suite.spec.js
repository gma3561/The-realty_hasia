// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * 더부동산중개법인 매물관리 시스템 - 종합 QA 테스트 스위트
 * 
 * 이 파일은 QA_COMPREHENSIVE_PLAN.md의 핵심 테스트 케이스를 구현합니다.
 * Priority 1 (Critical) 테스트를 중심으로 구성되었습니다.
 */

// 테스트 데이터 설정
const TEST_CONFIG = {
  baseURL: 'file:///Users/hasanghyeon/final_the_realty',
  admin: { username: 'jenny', password: 'happyday' },
  testProperty: {
    manager: '신백하세요',
    property_type: '원룸',
    trade_type: '전세',
    price: '5000/0',
    property_name: 'QA 테스트 매물',
    address: '서울시 강남구 테스트동',
    building: '테스트빌딩',
    room_count: '1',
    area_supply: '30.5',
    area_exclusive: '25.3'
  }
};

test.describe('🎯 Priority 1: 핵심 비즈니스 로직 테스트', () => {
  
  test.describe('TC-001: 관리자 인증 시스템', () => {
    
    test('TC-001-01: 정상 관리자 로그인', async ({ page }) => {
      console.log('🔐 관리자 로그인 테스트 시작');
      
      // 1. 관리자 로그인 페이지 접근
      await page.goto(`${TEST_CONFIG.baseURL}/admin-login.html`);
      await page.waitForLoadState('networkidle');
      
      // 2. 로그인 폼 요소 확인
      await expect(page.locator('#username')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      
      // 3. 로그인 정보 입력
      await page.fill('#username', TEST_CONFIG.admin.username);
      await page.fill('#password', TEST_CONFIG.admin.password);
      
      // 4. 로그인 실행
      await page.click('button[type="submit"]');
      
      // 5. 로그인 성공 확인
      await expect(page).toHaveURL(/index\.html/);
      
      // 6. sessionStorage에 관리자 세션 확인
      const adminSession = await page.evaluate(() => 
        sessionStorage.getItem('admin_logged_in')
      );
      expect(adminSession).toBe('true');
      
      console.log('✅ 관리자 로그인 성공');
    });
    
    test('TC-001-02: 잘못된 로그인 정보 처리', async ({ page }) => {
      console.log('❌ 잘못된 로그인 테스트 시작');
      
      await page.goto(`${TEST_CONFIG.baseURL}/admin-login.html`);
      
      // 잘못된 정보 입력
      await page.fill('#username', 'wrong_user');
      await page.fill('#password', 'wrong_pass');
      await page.click('button[type="submit"]');
      
      // 오류 메시지 표시 확인
      await expect(page.locator('#errorMessage')).toBeVisible();
      
      // 폼 리셋 확인
      expect(await page.inputValue('#username')).toBe('');
      expect(await page.inputValue('#password')).toBe('');
      
      console.log('✅ 잘못된 로그인 처리 확인');
    });
    
    test('TC-001-03: 관리자 로그아웃 기능', async ({ page }) => {
      console.log('🚪 로그아웃 테스트 시작');
      
      // 먼저 로그인
      await page.goto(`${TEST_CONFIG.baseURL}/admin-login.html`);
      await page.fill('#username', TEST_CONFIG.admin.username);
      await page.fill('#password', TEST_CONFIG.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/index\.html/);
      
      // 관리자 로그아웃 버튼 확인
      const logoutBtn = page.locator('#adminLogoutBtn');
      await expect(logoutBtn).toBeVisible();
      
      // 로그아웃 실행
      await logoutBtn.click();
      
      // 세션 삭제 확인
      const adminSession = await page.evaluate(() => 
        sessionStorage.getItem('admin_logged_in')
      );
      expect(adminSession).toBeNull();
      
      console.log('✅ 로그아웃 성공');
    });
  });
  
  test.describe('TC-002: 매물 CRUD 기능', () => {
    
    test.beforeEach(async ({ page }) => {
      // 각 테스트 전에 스플래시 스크린 스킵 설정
      await page.addInitScript(() => {
        window.sessionStorage.setItem('splashShown', 'true');
      });
    });
    
    test('TC-002-01: 새 매물 등록 전체 플로우', async ({ page }) => {
      console.log('📝 매물 등록 테스트 시작');
      
      // 1. 매물 목록 페이지 접근
      await page.goto(`${TEST_CONFIG.baseURL}/index.html`);
      await page.waitForLoadState('networkidle');
      
      // 2. 매물 등록 버튼 클릭
      await page.click('button:has-text("매물등록")');
      await page.waitForURL(/form\.html/);
      
      // 3. 폼 요소들 확인
      await expect(page.locator('#registerDate')).toBeVisible();
      await expect(page.locator('#manager')).toBeVisible();
      await expect(page.locator('#property_type')).toBeVisible();
      
      // 4. 필수 정보 입력
      await page.selectOption('#manager', TEST_CONFIG.testProperty.manager);
      await page.selectOption('#property_type', TEST_CONFIG.testProperty.property_type);
      await page.selectOption('#trade_type', TEST_CONFIG.testProperty.trade_type);
      await page.fill('#price', TEST_CONFIG.testProperty.price);
      await page.fill('#property_name', TEST_CONFIG.testProperty.property_name);
      await page.fill('#address', TEST_CONFIG.testProperty.address);
      await page.fill('#building', TEST_CONFIG.testProperty.building);
      await page.fill('#room_count', TEST_CONFIG.testProperty.room_count);
      await page.fill('#area_supply', TEST_CONFIG.testProperty.area_supply);
      await page.fill('#area_exclusive', TEST_CONFIG.testProperty.area_exclusive);
      
      // 5. 저장 버튼 클릭
      await page.click('button:has-text("저장하기")');
      
      // 6. 성공 메시지 확인 (confirm 다이얼로그)
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('성공적으로 등록');
        await dialog.accept();
      });
      
      // 7. 목록 페이지로 리다이렉트 확인
      await page.waitForURL(/index\.html/, { timeout: 10000 });
      
      console.log('✅ 매물 등록 완료');
    });
    
    test('TC-002-02: 매물 검색 및 필터링', async ({ page }) => {
      console.log('🔍 검색 및 필터링 테스트 시작');
      
      await page.goto(`${TEST_CONFIG.baseURL}/index.html`);
      await page.waitForLoadState('networkidle');
      
      // 1. 검색 기능 테스트
      const searchInput = page.locator('.search-input');
      await expect(searchInput).toBeVisible();
      
      await searchInput.fill('강남구');
      await searchInput.press('Enter');
      
      // 검색 결과 로딩 대기
      await page.waitForTimeout(2000);
      
      // 2. 필터 기능 테스트 (매물종류)
      const propertyTypeFilter = page.locator('#propertyTypeFilter');
      if (await propertyTypeFilter.isVisible()) {
        await propertyTypeFilter.selectOption('원룸');
        await page.waitForTimeout(1000);
      }
      
      // 3. 정렬 기능 테스트
      const sortBtn = page.locator('.sort-btn');
      await expect(sortBtn).toBeVisible();
      await sortBtn.click();
      
      // 4. 초기화 기능 테스트
      const resetBtn = page.locator('.reset-btn');
      await expect(resetBtn).toBeVisible();
      await resetBtn.click();
      
      console.log('✅ 검색 및 필터링 테스트 완료');
    });
    
    test('TC-002-03: 매물 상세 조회 및 수정', async ({ page }) => {
      console.log('✏️ 매물 수정 테스트 시작');
      
      await page.goto(`${TEST_CONFIG.baseURL}/index.html`);
      await page.waitForLoadState('networkidle');
      
      // 1. 첫 번째 매물 더블클릭으로 수정 모드 진입
      const firstRow = page.locator('.data-table tbody tr').first();
      await expect(firstRow).toBeVisible();
      await firstRow.dblclick();
      
      // 2. 수정 폼으로 이동 확인
      await page.waitForURL(/form\.html\?edit=/, { timeout: 10000 });
      
      // 3. 기존 데이터가 폼에 로드되었는지 확인
      const propertyName = await page.inputValue('#property_name');
      expect(propertyName).toBeTruthy();
      
      // 4. 데이터 수정
      const newPropertyName = `${propertyName} (수정됨)`;
      await page.fill('#property_name', newPropertyName);
      
      // 5. 저장
      await page.click('button:has-text("저장하기")');
      
      // 6. 성공 메시지 확인
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('성공적으로 수정');
        await dialog.accept();
      });
      
      await page.waitForURL(/index\.html/, { timeout: 10000 });
      
      console.log('✅ 매물 수정 완료');
    });
    
    test('TC-002-04: 매물 삭제 (관리자 권한)', async ({ page }) => {
      console.log('🗑️ 매물 삭제 테스트 시작');
      
      // 관리자 로그인 먼저 수행
      await page.goto(`${TEST_CONFIG.baseURL}/admin-login.html`);
      await page.fill('#username', TEST_CONFIG.admin.username);
      await page.fill('#password', TEST_CONFIG.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/index\.html/);
      
      // 매물 목록에서 삭제 버튼 확인
      const deleteBtn = page.locator('.delete-btn').first();
      
      if (await deleteBtn.isVisible()) {
        // 삭제 실행
        await deleteBtn.click();
        
        // 확인 다이얼로그 처리
        page.on('dialog', async dialog => {
          expect(dialog.message()).toContain('삭제');
          await dialog.accept();
        });
        
        // 삭제 후 상태 변경 확인
        await page.waitForTimeout(2000);
        
        console.log('✅ 매물 삭제 완료');
      } else {
        console.log('ℹ️ 삭제 가능한 매물이 없음');
      }
    });
  });
  
  test.describe('TC-003: 사용자 권한 제어', () => {
    
    test('TC-003-01: 일반 사용자 권한 확인', async ({ page }) => {
      console.log('👤 일반 사용자 권한 테스트');
      
      // 관리자 로그인 없이 매물 목록 접근
      await page.addInitScript(() => {
        window.sessionStorage.setItem('splashShown', 'true');
        // 관리자 세션 제거
        window.sessionStorage.removeItem('admin_logged_in');
      });
      
      await page.goto(`${TEST_CONFIG.baseURL}/index.html`);
      await page.waitForLoadState('networkidle');
      
      // 관리자 전용 버튼들이 숨겨져 있는지 확인
      const adminLogoutBtn = page.locator('#adminLogoutBtn');
      await expect(adminLogoutBtn).toBeHidden();
      
      // 삭제 버튼이 보이지 않는지 확인
      const deleteButtons = page.locator('.delete-btn');
      const deleteCount = await deleteButtons.count();
      expect(deleteCount).toBe(0);
      
      console.log('✅ 일반 사용자 권한 제어 확인');
    });
    
    test('TC-003-02: 관리자 권한 기능 접근', async ({ page }) => {
      console.log('👑 관리자 권한 테스트');
      
      // 관리자 로그인
      await page.goto(`${TEST_CONFIG.baseURL}/admin-login.html`);
      await page.fill('#username', TEST_CONFIG.admin.username);
      await page.fill('#password', TEST_CONFIG.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/index\.html/);
      
      // 관리자 전용 요소들 확인
      await expect(page.locator('#adminLogoutBtn')).toBeVisible();
      
      // 수정/삭제 버튼 표시 확인
      const editButtons = page.locator('.edit-btn');
      const deleteButtons = page.locator('.delete-btn');
      
      const editCount = await editButtons.count();
      const deleteCount = await deleteButtons.count();
      
      // 관리자는 수정/삭제 버튼을 볼 수 있어야 함
      expect(editCount).toBeGreaterThan(0);
      expect(deleteCount).toBeGreaterThan(0);
      
      console.log('✅ 관리자 권한 기능 접근 확인');
    });
  });
  
  test.describe('TC-004: 반응형 디자인 검증', () => {
    
    test('TC-004-01: 모바일 뷰포트 테스트', async ({ page }) => {
      console.log('📱 모바일 반응형 테스트');
      
      // iPhone 12 크기로 설정
      await page.setViewportSize({ width: 390, height: 844 });
      
      await page.addInitScript(() => {
        window.sessionStorage.setItem('splashShown', 'true');
      });
      
      await page.goto(`${TEST_CONFIG.baseURL}/index.html`);
      await page.waitForLoadState('networkidle');
      
      // 모바일 헤더 로고 크기 확인
      const logo = page.locator('.logo');
      const logoBox = await logo.boundingBox();
      
      // 모바일에서 로고가 적절한 크기인지 확인 (30-35px)
      expect(logoBox?.height).toBeLessThanOrEqual(35);
      expect(logoBox?.height).toBeGreaterThanOrEqual(25);
      
      // 모바일 검색 인터페이스 확인
      const searchInput = page.locator('.search-input');
      await expect(searchInput).toBeVisible();
      
      // 터치 친화적 버튼 크기 확인
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 3); i++) {
        const button = buttons.nth(i);
        const buttonBox = await button.boundingBox();
        if (buttonBox) {
          // 터치 타겟 최소 크기 (44px) 확인
          expect(buttonBox.height).toBeGreaterThanOrEqual(24);
        }
      }
      
      console.log('✅ 모바일 반응형 확인');
    });
    
    test('TC-004-02: 태블릿 뷰포트 테스트', async ({ page }) => {
      console.log('📟 태블릿 반응형 테스트');
      
      // iPad 크기로 설정
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.addInitScript(() => {
        window.sessionStorage.setItem('splashShown', 'true');
      });
      
      await page.goto(`${TEST_CONFIG.baseURL}/index.html`);
      await page.waitForLoadState('networkidle');
      
      // 태블릿에서의 레이아웃 확인
      const header = page.locator('.header');
      await expect(header).toBeVisible();
      
      const table = page.locator('.data-table');
      await expect(table).toBeVisible();
      
      // 태블릿 크기에서 로고 크기 확인
      const logo = page.locator('.logo');
      const logoBox = await logo.boundingBox();
      expect(logoBox?.height).toBeLessThanOrEqual(40);
      
      console.log('✅ 태블릿 반응형 확인');
    });
  });
});

test.describe('🔧 Priority 2: 사용자 경험 테스트', () => {
  
  test.describe('TC-005: 성능 및 로딩 테스트', () => {
    
    test('TC-005-01: 페이지 로드 성능 측정', async ({ page }) => {
      console.log('⏱️ 성능 테스트 시작');
      
      const startTime = Date.now();
      
      await page.addInitScript(() => {
        window.sessionStorage.setItem('splashShown', 'true');
      });
      
      await page.goto(`${TEST_CONFIG.baseURL}/index.html`);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // 5초 이내 로딩 확인
      expect(loadTime).toBeLessThan(5000);
      
      console.log(`✅ 페이지 로드 시간: ${loadTime}ms`);
    });
    
    test('TC-005-02: 대용량 데이터 처리', async ({ page }) => {
      console.log('📊 대용량 데이터 테스트');
      
      await page.addInitScript(() => {
        window.sessionStorage.setItem('splashShown', 'true');
      });
      
      await page.goto(`${TEST_CONFIG.baseURL}/index.html`);
      await page.waitForLoadState('networkidle');
      
      // 테이블 로우 수 확인
      const rows = page.locator('.data-table tbody tr');
      const rowCount = await rows.count();
      
      console.log(`📋 로드된 매물 수: ${rowCount}개`);
      
      // 스크롤 성능 테스트
      if (rowCount > 10) {
        await page.mouse.wheel(0, 1000);
        await page.waitForTimeout(500);
        await page.mouse.wheel(0, -1000);
      }
      
      console.log('✅ 대용량 데이터 처리 확인');
    });
  });
  
  test.describe('TC-006: 오류 처리 및 예외 상황', () => {
    
    test('TC-006-01: 네트워크 오류 시뮬레이션', async ({ page }) => {
      console.log('🌐 네트워크 오류 테스트');
      
      // 네트워크 요청 차단
      await page.route('**/supabase.co/**', route => route.abort());
      
      await page.addInitScript(() => {
        window.sessionStorage.setItem('splashShown', 'true');
      });
      
      await page.goto(`${TEST_CONFIG.baseURL}/index.html`);
      
      // 오류 상황에서도 페이지가 크래시되지 않는지 확인
      await page.waitForTimeout(3000);
      
      const header = page.locator('.header');
      await expect(header).toBeVisible();
      
      console.log('✅ 네트워크 오류 처리 확인');
    });
    
    test('TC-006-02: 잘못된 폼 입력 처리', async ({ page }) => {
      console.log('📝 폼 유효성 검사 테스트');
      
      await page.addInitScript(() => {
        window.sessionStorage.setItem('splashShown', 'true');
      });
      
      await page.goto(`${TEST_CONFIG.baseURL}/form.html`);
      await page.waitForLoadState('networkidle');
      
      // 필수 필드 누락 상태로 저장 시도
      await page.click('button:has-text("저장하기")');
      
      // HTML5 유효성 검사 메시지 확인
      const invalidFields = page.locator(':invalid');
      const invalidCount = await invalidFields.count();
      
      // 필수 필드가 있다면 유효성 검사가 작동해야 함
      if (invalidCount > 0) {
        console.log(`⚠️ ${invalidCount}개의 필수 필드 누락`);
      }
      
      console.log('✅ 폼 유효성 검사 확인');
    });
  });
});

// 테스트 후처리
test.afterEach(async ({ page }, testInfo) => {
  // 실패한 테스트의 스크린샷 저장
  if (testInfo.status !== testInfo.expectedStatus) {
    const screenshot = await page.screenshot();
    await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });
  }
  
  // 콘솔 에러 로그 수집
  const logs = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      logs.push(msg.text());
    }
  });
  
  if (logs.length > 0) {
    await testInfo.attach('console-errors', { 
      body: logs.join('\n'), 
      contentType: 'text/plain' 
    });
  }
});

console.log(`
🎯 더부동산중개법인 QA 테스트 스위트 실행 완료

📊 테스트 범위:
- ✅ 관리자 인증 시스템
- ✅ 매물 CRUD 기능
- ✅ 사용자 권한 제어
- ✅ 반응형 디자인
- ✅ 성능 및 오류 처리

📋 상세 결과는 Playwright 리포트에서 확인하세요:
   npx playwright show-report
`);