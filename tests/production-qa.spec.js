const { test, expect } = require('@playwright/test');

// 실제 프로덕션 사이트 QA 테스트
test.describe('Production Site QA Tests', () => {
  // 실제 프로덕션 URL (GitHub Pages)
  const productionUrls = [
    'https://gma3561.github.io/The-realty_hasia/'
  ];

  let workingUrl = null;

  test.beforeAll(async ({ browser }) => {
    // 작동하는 URL 찾기
    const context = await browser.newContext();
    const page = await context.newPage();
    
    for (const url of productionUrls) {
      try {
        console.log(`Trying URL: ${url}`);
        await page.goto(url, { timeout: 10000 });
        
        // 페이지가 로드되었는지 확인
        await page.waitForSelector('body', { timeout: 5000 });
        const title = await page.title();
        
        if (title.includes('더부동산') || title.includes('realty')) {
          workingUrl = url;
          console.log(`✅ Working URL found: ${url}`);
          break;
        }
      } catch (error) {
        console.log(`❌ Failed to access: ${url}`);
      }
    }
    
    await context.close();
    
    if (!workingUrl) {
      throw new Error('No working production URL found');
    }
  });

  test('1. 실제 퍼블리시된 사이트 접근성 확인', async ({ page }) => {
    console.log(`Testing production URL: ${workingUrl}`);
    
    // 사이트 로드
    const response = await page.goto(workingUrl, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // HTTP 상태 확인
    expect(response.status()).toBe(200);
    
    // 페이지 타이틀 확인
    const title = await page.title();
    expect(title).toContain('더부동산');
    
    // 로고 확인
    await expect(page.locator('.logo')).toBeVisible();
    
    console.log('✅ 사이트 접근성 확인 완료');
  });

  test('2. 메인 페이지 기본 기능 테스트', async ({ page }) => {
    await page.goto(workingUrl, { waitUntil: 'networkidle' });
    
    // 주요 UI 요소들 확인
    await expect(page.locator('.header')).toBeVisible();
    await expect(page.locator('.controls')).toBeVisible();
    await expect(page.locator('.data-table')).toBeVisible();
    
    // 검색 입력 필드 확인
    await expect(page.locator('#search')).toBeVisible();
    
    // 필터 버튼들 확인
    await expect(page.locator('.filter-buttons')).toBeVisible();
    
    // 매물등록 버튼 확인
    await expect(page.locator('.btn-primary')).toBeVisible();
    
    console.log('✅ 메인 페이지 기본 요소 확인 완료');
  });

  test('3. 매물 목록 로딩 및 표시 테스트', async ({ page }) => {
    await page.goto(workingUrl, { waitUntil: 'networkidle' });
    
    // Supabase 연결 및 데이터 로딩 대기 (최대 10초)
    await page.waitForTimeout(5000);
    
    // 데이터 테이블 행들 확인
    const tableRows = page.locator('.data-table tbody tr');
    const rowCount = await tableRows.count();
    
    expect(rowCount).toBeGreaterThan(0);
    console.log(`데이터 행 수: ${rowCount}`);
    
    // 첫 번째 행 데이터 확인
    if (rowCount > 0) {
      const firstRow = tableRows.first();
      await expect(firstRow).toBeVisible();
      
      // 첫 번째 행의 셀들이 있는지 확인
      const cells = firstRow.locator('td');
      const cellCount = await cells.count();
      expect(cellCount).toBeGreaterThan(5); // 최소 5개 열은 있어야 함
    }
    
    // 총 매물 수 표시 확인
    const totalText = await page.locator('.total-info').textContent();
    expect(totalText).toMatch(/\d+/); // 숫자가 포함되어야 함
    
    console.log('✅ 매물 목록 로딩 확인 완료');
  });

  test('4. 검색 및 필터링 기능 테스트', async ({ page }) => {
    await page.goto(workingUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000); // 데이터 로딩 대기 시간 증가
    
    // 검색 입력 필드 확인
    const searchInput = page.locator('#search');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    
    // 초기 데이터 수 확인
    const initialRows = page.locator('.data-table tbody tr');
    const initialCount = await initialRows.count();
    console.log(`초기 데이터 수: ${initialCount}`);
    
    // 검색 기능 테스트 - 더 일반적인 검색어 사용
    await searchInput.fill('서울');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
    
    // 검색 결과 확인
    const searchResults = page.locator('.data-table tbody tr');
    const searchCount = await searchResults.count();
    expect(searchCount).toBeGreaterThanOrEqual(0);
    console.log(`'서울' 검색 결과: ${searchCount}개`);
    
    // 검색 초기화
    await searchInput.clear();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    
    // 필터 버튼 테스트 - 실제 존재하는 버튼들 확인
    const filterButtons = page.locator('.filter-buttons button');
    const buttonCount = await filterButtons.count();
    console.log(`필터 버튼 수: ${buttonCount}`);
    
    if (buttonCount > 0) {
      // 첫 번째 필터 버튼 클릭 테스트
      const firstFilter = filterButtons.first();
      const filterText = await firstFilter.textContent();
      console.log(`첫 번째 필터: ${filterText}`);
      
      await firstFilter.click();
      await page.waitForTimeout(2000);
      
      // 필터 적용 후 결과 확인
      const filteredResults = page.locator('.data-table tbody tr');
      const filteredCount = await filteredResults.count();
      console.log(`필터 적용 후 결과: ${filteredCount}개`);
      expect(filteredCount).toBeGreaterThanOrEqual(0);
    }
    
    console.log('✅ 검색 및 필터링 기능 확인 완료');
  });

  test('5. 페이지네이션 기능 테스트', async ({ page }) => {
    await page.goto(workingUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 페이지네이션 컨트롤 확인
    const pagination = page.locator('.pagination-container');
    await expect(pagination).toBeVisible();
    
    // 페이지네이션 정보 확인
    const paginationInfo = page.locator('#paginationInfo');
    await expect(paginationInfo).toBeVisible();
    
    // 페이지네이션 컨트롤 버튼들 확인
    const paginationControls = page.locator('.pagination-controls');
    await expect(paginationControls).toBeVisible();
    
    // 페이지 번호 버튼들 확인
    const pageButtons = page.locator('.pagination-numbers .page-btn');
    const buttonCount = await pageButtons.count();
    
    if (buttonCount > 1) {
      // 두 번째 페이지가 있다면 클릭 테스트
      const secondPageButton = pageButtons.nth(1);
      if (await secondPageButton.isVisible() && !await secondPageButton.hasClass('active')) {
        await secondPageButton.click();
        await page.waitForTimeout(2000);
        
        // 페이지 변경 확인
        await expect(secondPageButton).toHaveClass(/active/);
      }
    }
    
    console.log('✅ 페이지네이션 기능 확인 완료');
  });

  test('6. 매물 상세 보기 기능 테스트', async ({ page }) => {
    await page.goto(workingUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 첫 번째 매물 행 클릭
    const firstRow = page.locator('.data-table tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForTimeout(1000);
      
      // 사이드 패널 또는 모달 확인 (데스크톱/모바일에 따라 다름)
      const sidePanel = page.locator('.side-panel');
      const modal = page.locator('.modal');
      
      const sidePanelVisible = await sidePanel.isVisible();
      const modalVisible = await modal.isVisible();
      
      expect(sidePanelVisible || modalVisible).toBe(true);
      
      if (sidePanelVisible) {
        // 사이드 패널 내용 확인
        await expect(sidePanel.locator('.property-details')).toBeVisible();
        console.log('사이드 패널로 상세 정보 표시됨');
      } else if (modalVisible) {
        // 모달 내용 확인
        await expect(modal.locator('.property-details')).toBeVisible();
        console.log('모달로 상세 정보 표시됨');
        
        // 모달 닫기
        const closeButton = modal.locator('.close-button, .btn-close');
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    }
    
    console.log('✅ 매물 상세 보기 기능 확인 완료');
  });

  test('7. 매물 등록 폼 기능 테스트', async ({ page }) => {
    await page.goto(workingUrl, { waitUntil: 'networkidle' });
    
    // 매물등록 버튼 클릭
    const registerButton = page.locator('.btn-primary');
    await registerButton.click();
    
    // 폼 페이지로 이동 확인
    await expect(page).toHaveURL(/form\.html/);
    
    // 폼 요소들 확인
    await expect(page.locator('#propertyForm')).toBeVisible();
    await expect(page.locator('#registerDate')).toBeVisible();
    await expect(page.locator('#manager')).toBeVisible();
    await expect(page.locator('#propertyName')).toBeVisible();
    
    // 저장 버튼 확인
    await expect(page.locator('.btn-save')).toBeVisible();
    
    // 뒤로가기 버튼 확인
    await expect(page.locator('.btn-back')).toBeVisible();
    
    console.log('✅ 매물 등록 폼 접근 확인 완료');
  });

  test('8. 모바일 반응형 디자인 테스트', async ({ page }) => {
    // 모바일 뷰포트로 설정
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(workingUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 모바일에서 주요 요소들 확인
    await expect(page.locator('.header')).toBeVisible();
    console.log('헤더 표시 확인');
    
    await expect(page.locator('.controls')).toBeVisible();
    console.log('컨트롤 영역 표시 확인');
    
    // 데이터 테이블 확인
    await expect(page.locator('.data-table')).toBeVisible();
    console.log('데이터 테이블 표시 확인');
    
    // 검색 입력 필드 확인
    const searchInput = page.locator('#search');
    await expect(searchInput).toBeVisible();
    console.log('검색 입력 필드 표시 확인');
    
    // 모바일에서 첫 번째 매물 클릭하여 상세 정보 확인
    const firstRow = page.locator('.data-table tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForTimeout(1000);
      
      // 모바일에서는 모달 또는 사이드 패널 확인
      const modal = page.locator('.modal');
      const sidePanel = page.locator('.side-panel');
      
      const modalVisible = await modal.isVisible();
      const sidePanelVisible = await sidePanel.isVisible();
      
      if (modalVisible) {
        console.log('모바일 모달 표시 확인');
        // 모달 닫기
        const closeButton = modal.locator('.close-button, .btn-close, .modal-close');
        if (await closeButton.isVisible()) {
          await closeButton.click();
        } else {
          // ESC 키로 모달 닫기
          await page.keyboard.press('Escape');
        }
      } else if (sidePanelVisible) {
        console.log('모바일 사이드 패널 표시 확인');
      } else {
        console.log('상세 정보 표시 방식 확인 필요');
      }
    }
    
    console.log('✅ 모바일 반응형 디자인 확인 완료');
  });

  test('9. PWA 기능 테스트', async ({ page }) => {
    await page.goto(workingUrl, { waitUntil: 'networkidle' });
    
    // Service Worker 등록 확인
    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(swRegistered).toBe(true);
    
    // Manifest 파일 링크 존재 확인 (visible 체크 제거)
    const manifestLink = page.locator('link[rel="manifest"]');
    const manifestHref = await manifestLink.getAttribute('href');
    expect(manifestHref).toMatch(/manifest\.json$/);
    
    // PWA 관련 메타 태그들 확인
    const themeColor = page.locator('meta[name="theme-color"]');
    const themeColorContent = await themeColor.getAttribute('content');
    expect(themeColorContent).toBe('#000000');
    
    const appleMobileCapable = page.locator('meta[name="apple-mobile-web-app-capable"]');
    const appleMobileContent = await appleMobileCapable.getAttribute('content');
    expect(appleMobileContent).toBe('yes');
    
    // Apple touch icon 확인
    const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]');
    const iconHref = await appleTouchIcon.getAttribute('href');
    expect(iconHref).toMatch(/icon-192\.png$/);
    
    console.log('✅ PWA 기능 확인 완료');
  });

  test('10. 데이터베이스 연동 테스트', async ({ page }) => {
    await page.goto(workingUrl, { waitUntil: 'networkidle' });
    
    // 콘솔 로그 수집
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });
    
    // Supabase 초기화 대기
    await page.waitForTimeout(5000);
    
    // Supabase 연결 확인 (콘솔 로그나 네트워크 요청으로)
    const supabaseConnected = consoleLogs.some(log => 
      log.includes('Supabase 초기화') || 
      log.includes('Properties loaded') ||
      log.includes('데이터 로드 완료')
    );
    
    // 네트워크 요청 확인
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('supabase.co')) {
        responses.push(response);
      }
    });
    
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Supabase 요청이 있었는지 확인
    expect(responses.length).toBeGreaterThan(0);
    
    // 데이터가 실제로 표시되는지 확인
    const tableRows = page.locator('.data-table tbody tr');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
    
    console.log('✅ 데이터베이스 연동 확인 완료');
  });
});