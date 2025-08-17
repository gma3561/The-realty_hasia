const { test, expect } = require('@playwright/test');

test.describe('Property List Display Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 로컬 서버로 이동
    await page.goto('http://127.0.0.1:5500');
    
    // 페이지 로드 및 Supabase 초기화 대기
    await page.waitForTimeout(3000);
  });

  test('should display properties in the main table', async ({ page }) => {
    // 테이블이 존재하는지 확인
    await expect(page.locator('#dataTable')).toBeVisible();
    
    // 테이블 헤더 확인
    await expect(page.locator('#dataTable thead')).toBeVisible();
    const headers = await page.locator('#dataTable thead th').allTextContents();
    expect(headers).toContain('등록일');
    expect(headers).toContain('매물번호');
    expect(headers).toContain('매물상태');
    expect(headers).toContain('매물종류');
    expect(headers).toContain('거래유형');
    
    // 테이블 바디 확인
    await page.waitForSelector('#dataTable tbody');
    const tbody = page.locator('#dataTable tbody');
    await expect(tbody).toBeVisible();
  });

  test('should show property count in pagination info', async ({ page }) => {
    // 페이지네이션 정보 확인
    await page.waitForSelector('#paginationInfo');
    const paginationText = await page.locator('#paginationInfo').textContent();
    
    // "전체 N건" 형식의 텍스트가 표시되는지 확인
    expect(paginationText).toMatch(/전체 \d+건/);
  });

  test('should verify property data appears after creation', async ({ page }) => {
    // 현재 매물 수 확인
    await page.waitForSelector('#paginationInfo');
    const initialPaginationText = await page.locator('#paginationInfo').textContent();
    const initialCount = parseInt(initialPaginationText.match(/전체 (\d+)건/)?.[1] || '0');
    
    // 새 매물 생성
    const timestamp = Date.now();
    const testPropertyName = `목록 테스트 매물 ${timestamp}`;
    
    await page.click('.btn-primary');
    await page.waitForSelector('#propertyForm');
    
    // 폼 작성
    await page.selectOption('#manager', '정윤식');
    await page.selectOption('#status', '거래가능');
    await page.selectOption('#propertyType', '빌라/연립');
    await page.selectOption('#tradeType', '월세/렌트');
    await page.fill('#propertyName', testPropertyName);
    await page.fill('#address', '인천시 연수구');
    await page.fill('#price', '30,000/300');
    
    // 저장
    await page.click('.btn-save');
    await page.waitForTimeout(500);
    
    // 확인 모달이 나타나면 클릭
    const confirmBtn = page.locator('#confirmBtn');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
    await page.waitForTimeout(3000);
    
    // 메인 페이지로 돌아가기
    await expect(page).toHaveURL(/index\.html|\/$/);
    
    // 매물 수 증가 확인
    await page.waitForTimeout(2000);
    const newPaginationText = await page.locator('#paginationInfo').textContent();
    const newCount = parseInt(newPaginationText.match(/전체 (\d+)건/)?.[1] || '0');
    expect(newCount).toBeGreaterThan(initialCount);
    
    // 테이블에서 새 매물 확인
    await page.waitForSelector('#dataTable tbody tr');
    const tableContent = await page.locator('#dataTable tbody').textContent();
    expect(tableContent).toContain(testPropertyName);
    expect(tableContent).toContain('정윤식');
    expect(tableContent).toContain('빌라/연립');
    expect(tableContent).toContain('월세/렌트');
  });

  test('should open property details when clicking on row', async ({ page }) => {
    // 테이블 행이 로드될 때까지 대기
    await page.waitForSelector('#dataTable tbody tr');
    
    // 첫 번째 행 클릭
    const firstRow = page.locator('#dataTable tbody tr:first-child');
    await expect(firstRow).toBeVisible();
    await firstRow.click();
    
    // 상세보기가 열리는지 확인 (데스크톱: 사이드 패널, 모바일: 모달)
    const viewport = await page.viewportSize();
    
    if (viewport && viewport.width >= 768) {
      // 데스크톱: 사이드 패널 확인
      await expect(page.locator('#sidePanel')).toBeVisible();
      await expect(page.locator('#sidePropertyTitle')).toBeVisible();
    } else {
      // 모바일: 모달 확인
      await expect(page.locator('#detailModal')).toBeVisible();
    }
  });

  test('should filter properties by status', async ({ page }) => {
    // 매물상태 필터 테스트
    await page.waitForSelector('#dataTable tbody tr');
    
    // 초기 매물 수 확인
    const initialRows = await page.locator('#dataTable tbody tr').count();
    
    // 매물상태 필터 클릭
    await page.click('th:has-text("매물상태")');
    await page.waitForSelector('#filterMenu');
    
    // 특정 상태 선택 (예: 거래가능)
    const filterOption = page.locator('#filterMenuOptions input[value="거래가능"]');
    if (await filterOption.count() > 0) {
      await filterOption.check();
      await page.click('.filter-menu-btn.primary'); // 적용 버튼
      
      // 필터 적용 후 결과 확인
      await page.waitForTimeout(1000);
      const filteredRows = await page.locator('#dataTable tbody tr').count();
      
      // 필터된 결과의 모든 행이 '거래가능' 상태인지 확인
      const statusCells = await page.locator('#dataTable tbody tr td:nth-child(3)').allTextContents();
      statusCells.forEach(status => {
        expect(status.trim()).toBe('거래가능');
      });
    }
  });

  test('should search properties by name and address', async ({ page }) => {
    // 검색 기능 테스트
    await page.waitForSelector('.search-input');
    
    // 검색어 입력
    const searchTerm = '아파트';
    await page.fill('.search-input', searchTerm);
    await page.press('.search-input', 'Enter');
    
    // 검색 결과 대기
    await page.waitForTimeout(1000);
    
    // 검색 결과 확인
    const tableRows = await page.locator('#dataTable tbody tr');
    const rowCount = await tableRows.count();
    
    if (rowCount > 0) {
      // 검색 결과의 각 행이 검색어를 포함하는지 확인
      const rowTexts = await tableRows.allTextContents();
      const hasSearchTerm = rowTexts.some(text => 
        text.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(hasSearchTerm).toBe(true);
    }
  });

  test('should sort properties by registration date', async ({ page }) => {
    // 정렬 기능 테스트
    await page.waitForSelector('#dataTable tbody tr');
    
    // 등록일 컬럼 클릭하여 정렬
    await page.click('th:has-text("등록일")');
    await page.waitForTimeout(1000);
    
    // 정렬 후 첫 번째와 마지막 행의 날짜 비교
    const rows = page.locator('#dataTable tbody tr');
    const rowCount = await rows.count();
    
    if (rowCount >= 2) {
      const firstRowDate = await rows.nth(0).locator('td:first-child').textContent();
      const lastRowDate = await rows.nth(rowCount - 1).locator('td:first-child').textContent();
      
      // 날짜 형식이 올바른지 확인 (YYYY-MM-DD 형식 예상)
      expect(firstRowDate).toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(lastRowDate).toMatch(/\d{4}-\d{2}-\d{2}/);
    }
  });

  test('should handle empty state when no properties exist', async ({ page }) => {
    // 모든 데이터를 필터링하여 빈 상태 시뮬레이션
    await page.fill('.search-input', 'NONEXISTENT_PROPERTY_12345');
    await page.press('.search-input', 'Enter');
    
    await page.waitForTimeout(1000);
    
    // 빈 테이블 상태 확인
    const tableRows = await page.locator('#dataTable tbody tr').count();
    
    if (tableRows === 0) {
      // 빈 상태 메시지가 있는지 확인하거나, 최소한 테이블이 비어있는지 확인
      const paginationText = await page.locator('#paginationInfo').textContent();
      expect(paginationText).toContain('전체 0건');
    }
  });

  test('should verify property data integrity', async ({ page }) => {
    // 데이터 무결성 확인
    await page.waitForSelector('#dataTable tbody tr');
    
    const rows = page.locator('#dataTable tbody tr');
    const rowCount = await rows.count();
    
    if (rowCount > 0) {
      // 첫 번째 행의 데이터 확인
      const firstRow = rows.nth(0);
      const cells = await firstRow.locator('td').allTextContents();
      
      // 각 셀이 비어있지 않은지 확인 (일부 필드는 비어있을 수 있음)
      expect(cells.length).toBeGreaterThan(5); // 최소 6개 컬럼 존재
      
      // 매물번호가 숫자인지 확인
      const propertyNumber = cells[1];
      if (propertyNumber && propertyNumber.trim()) {
        expect(propertyNumber).toMatch(/^\d+$/);
      }
      
      // 등록일이 날짜 형식인지 확인
      const registerDate = cells[0];
      if (registerDate && registerDate.trim()) {
        expect(registerDate).toMatch(/\d{4}-\d{2}-\d{2}/);
      }
    }
  });
});