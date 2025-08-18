import { test, expect } from '@playwright/test';

test.describe('기본 CRUD 기능 체크', () => {
  const PRODUCTION_URL = 'https://gma3561.github.io/The-realty_hasia/';
  
  test('사이트 로딩 및 기본 요소 확인', async ({ page }) => {
    console.log('🔍 사이트 로딩 테스트 시작');
    
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    
    // 기본 요소들 확인
    await expect(page.locator('.data-table')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('.btn-primary')).toBeVisible();
    
    console.log('✅ 사이트 로딩 및 기본 요소 확인 완료');
    
    // 스크린샷 캡처
    await page.screenshot({ path: 'test-results/basic-loading.png', fullPage: true });
  });

  test('매물 등록 폼 열기 테스트', async ({ page }) => {
    console.log('🔍 매물 등록 폼 테스트 시작');
    
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('.data-table', { timeout: 20000 });
    
    // 매물 등록 버튼 클릭
    await page.click('.btn-primary');
    
    // 폼이 열리는지 확인 (여러 가능한 셀렉터 시도)
    const formSelectors = ['#propertyModal', '.modal', '.form-modal', '.property-form'];
    let formFound = false;
    
    for (const selector of formSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000, state: 'visible' });
        console.log(`✅ 폼 발견: ${selector}`);
        formFound = true;
        break;
      } catch (e) {
        console.log(`❌ ${selector} 찾을 수 없음`);
      }
    }
    
    if (!formFound) {
      // 현재 페이지 상태 확인
      const url = page.url();
      console.log(`현재 URL: ${url}`);
      
      // 스크린샷으로 상태 확인
      await page.screenshot({ path: 'test-results/form-open-attempt.png', fullPage: true });
      
      // 페이지의 모든 모달/폼 관련 요소 확인
      const allModals = await page.locator('[class*="modal"], [id*="modal"], [class*="form"], [id*="form"]').all();
      console.log(`페이지의 모달/폼 요소 수: ${allModals.length}`);
      
      for (let i = 0; i < allModals.length; i++) {
        const element = allModals[i];
        const className = await element.getAttribute('class');
        const id = await element.getAttribute('id');
        const isVisible = await element.isVisible();
        console.log(`  ${i + 1}. class="${className}" id="${id}" visible=${isVisible}`);
      }
    }
    
    expect(formFound).toBe(true);
  });

  test('매물 목록 데이터 확인', async ({ page }) => {
    console.log('🔍 매물 목록 데이터 확인 테스트 시작');
    
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('.data-table', { timeout: 20000 });
    
    // 테이블 행 확인
    const rows = page.locator('.data-table tbody tr');
    const rowCount = await rows.count();
    
    console.log(`📊 현재 매물 수: ${rowCount}개`);
    
    if (rowCount > 0) {
      // 첫 번째 행의 데이터 확인
      const firstRow = rows.first();
      const cells = firstRow.locator('td');
      const cellCount = await cells.count();
      
      console.log(`📋 첫 번째 행 컬럼 수: ${cellCount}개`);
      
      // 각 셀의 내용 확인
      for (let i = 0; i < Math.min(cellCount, 5); i++) {
        const cellText = await cells.nth(i).textContent();
        console.log(`  컬럼 ${i + 1}: "${cellText?.substring(0, 20)}${cellText && cellText.length > 20 ? '...' : ''}"`);
      }
    }
    
    console.log('✅ 매물 목록 데이터 확인 완료');
  });

  test('검색 기능 기본 테스트', async ({ page }) => {
    console.log('🔍 검색 기능 테스트 시작');
    
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('.data-table', { timeout: 20000 });
    
    // 검색 입력 필드 찾기
    const searchSelectors = ['.search-input', '#searchInput', 'input[placeholder*="검색"]', '.filter-left input'];
    let searchInput = null;
    
    for (const selector of searchSelectors) {
      try {
        searchInput = page.locator(selector);
        if (await searchInput.isVisible()) {
          console.log(`✅ 검색 입력 필드 발견: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ ${selector} 찾을 수 없음`);
      }
    }
    
    if (searchInput && await searchInput.isVisible()) {
      // 검색 테스트
      await searchInput.fill('아파트');
      await page.waitForTimeout(1000);
      
      const rowsAfterSearch = await page.locator('.data-table tbody tr').count();
      console.log(`🔍 '아파트' 검색 후 결과: ${rowsAfterSearch}개`);
      
      // 검색 초기화
      await searchInput.fill('');
      await page.waitForTimeout(1000);
      
      console.log('✅ 검색 기능 기본 테스트 완료');
    } else {
      console.log('⚠️ 검색 입력 필드를 찾을 수 없음');
    }
  });

  test('관리자 버튼 및 기능 확인', async ({ page }) => {
    console.log('🔍 관리자 기능 확인 테스트 시작');
    
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('.data-table', { timeout: 20000 });
    
    // 편집/삭제 버튼 찾기
    const editSelectors = ['.edit-btn', '.modify-btn', '[onclick*="edit"]', '[onclick*="modify"]', 'button[title*="수정"]'];
    const deleteSelectors = ['.delete-btn', '.remove-btn', '[onclick*="delete"]', '[onclick*="remove"]', 'button[title*="삭제"]'];
    
    let editButtonFound = false;
    let deleteButtonFound = false;
    
    for (const selector of editSelectors) {
      const buttons = page.locator(selector);
      const count = await buttons.count();
      if (count > 0) {
        console.log(`✅ 편집 버튼 발견: ${selector} (${count}개)`);
        editButtonFound = true;
        break;
      }
    }
    
    for (const selector of deleteSelectors) {
      const buttons = page.locator(selector);
      const count = await buttons.count();
      if (count > 0) {
        console.log(`✅ 삭제 버튼 발견: ${selector} (${count}개)`);
        deleteButtonFound = true;
        break;
      }
    }
    
    console.log(`📊 관리자 버튼 상태: 편집(${editButtonFound}) 삭제(${deleteButtonFound})`);
    console.log('✅ 관리자 기능 확인 완료');
  });

  test('페이지 반응성 및 모바일 호환성', async ({ page }) => {
    console.log('🔍 페이지 반응성 테스트 시작');
    
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      console.log(`📱 ${viewport.name} 뷰포트 테스트: ${viewport.width}x${viewport.height}`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
      await page.waitForSelector('.data-table', { timeout: 20000 });
      
      // 기본 요소들이 보이는지 확인
      const tableVisible = await page.locator('.data-table').isVisible();
      const headerVisible = await page.locator('.header, .container > .header').isVisible();
      
      console.log(`  테이블 표시: ${tableVisible}, 헤더 표시: ${headerVisible}`);
      
      // 스크린샷 캡처
      await page.screenshot({ 
        path: `test-results/responsive-${viewport.name.toLowerCase()}.png`, 
        fullPage: false 
      });
    }
    
    console.log('✅ 페이지 반응성 테스트 완료');
  });
});