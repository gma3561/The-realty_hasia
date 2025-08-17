const { test, expect } = require('@playwright/test');

test.describe('Supabase Integration Tests', () => {
  let testPropertyId;
  
  test.beforeEach(async ({ page }) => {
    // 로컬 서버로 이동
    await page.goto('http://127.0.0.1:5500');
    
    // Supabase 초기화 대기
    await page.waitForTimeout(3000);
  });

  test('should save property data to Supabase database', async ({ page }) => {
    // 매물등록 페이지로 이동
    await page.click('.btn-primary');
    await expect(page).toHaveURL(/form\.html/);
    
    // 폼 로드 대기
    await page.waitForSelector('#propertyForm');
    
    // 고유한 테스트 데이터 생성 (타임스탬프 사용)
    const timestamp = Date.now();
    const testData = {
      propertyName: `테스트 아파트 ${timestamp}`,
      address: `서울시 강남구 테스트동 ${timestamp}번지`,
      manager: '김규민',
      status: '거래가능',
      propertyType: '아파트',
      tradeType: '매매',
      price: '150,000'
    };

    // 폼 데이터 입력
    await page.selectOption('#manager', testData.manager);
    await page.selectOption('#status', testData.status);
    await page.selectOption('#propertyType', testData.propertyType);
    await page.selectOption('#tradeType', testData.tradeType);
    await page.fill('#propertyName', testData.propertyName);
    await page.fill('#address', testData.address);
    await page.fill('#price', testData.price);

    // 콘솔 로그 모니터링
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    // 저장 실행
    await page.click('.btn-save');
    await page.waitForTimeout(500);
    const confirmBtn2 = page.locator('#confirmBtn');
    if (await confirmBtn2.isVisible()) {
      await confirmBtn2.click();
    }
    
    // 저장 완료 대기
    await page.waitForTimeout(4000);

    // Supabase 저장 성공 로그 확인
    const saveSuccessLog = consoleLogs.find(log => 
      log.includes('매물 등록 완료') || 
      log.includes('저장되었습니다')
    );
    
    expect(saveSuccessLog).toBeDefined();

    // 메인 페이지로 리다이렉션 확인
    await expect(page).toHaveURL(/index\.html|\/$/);
    
    // 페이지에서 생성된 매물 ID 추출 (콘솔이나 로컬 스토리지에서)
    testPropertyId = await page.evaluate(() => {
      return localStorage.getItem('lastCreatedPropertyId');
    });
  });

  test('should retrieve saved property from Supabase', async ({ page }) => {
    // 페이지 로드 후 매물 목록 확인
    await page.waitForSelector('#dataTable tbody');
    
    // 테이블에 데이터가 로드되는지 확인
    const tableRows = await page.locator('#dataTable tbody tr').count();
    expect(tableRows).toBeGreaterThan(0);
    
    // 첫 번째 매물 데이터 확인
    const firstRowText = await page.locator('#dataTable tbody tr:first-child').textContent();
    expect(firstRowText).toBeTruthy();
    expect(firstRowText.length).toBeGreaterThan(0);
  });

  test('should verify property appears in list after creation', async ({ page }) => {
    // 매물 생성 프로세스
    await page.click('.btn-primary');
    await page.waitForSelector('#propertyForm');
    
    const uniqueId = Date.now();
    const testPropertyName = `검증용 매물 ${uniqueId}`;
    
    // 폼 작성
    await page.selectOption('#manager', '정서연');
    await page.selectOption('#status', '거래가능');
    await page.selectOption('#propertyType', '오피스텔');
    await page.selectOption('#tradeType', '전세');
    await page.fill('#propertyName', testPropertyName);
    await page.fill('#address', '부산시 해운대구');
    await page.fill('#price', '50,000');
    
    // 저장
    await page.click('.btn-save');
    await page.waitForTimeout(500);
    const confirmBtn = page.locator('#confirmBtn');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
    await page.waitForTimeout(3000);
    
    // 메인 페이지로 돌아가서 목록 확인
    await expect(page).toHaveURL(/index\.html|\/$/);
    await page.waitForTimeout(2000);
    
    // 생성한 매물이 목록에 나타나는지 확인
    await page.waitForSelector('#dataTable tbody tr');
    const tableContent = await page.locator('#dataTable tbody').textContent();
    expect(tableContent).toContain(testPropertyName);
  });

  test('should handle Supabase connection errors gracefully', async ({ page }) => {
    // 네트워크 연결을 차단하여 에러 상황 시뮬레이션
    await page.route('https://gojajqzajzhqkhmubpql.supabase.co/**', route => {
      route.abort();
    });
    
    // 매물등록 시도
    await page.click('.btn-primary');
    await page.waitForSelector('#propertyForm');
    
    await page.selectOption('#manager', '하상현');
    await page.fill('#propertyName', '연결 에러 테스트');
    
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });
    
    await page.click('.btn-save');
    await page.waitForTimeout(500);
    const confirmBtn = page.locator('#confirmBtn');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
    await page.waitForTimeout(3000);
    
    // 에러 로그가 기록되는지 확인
    const errorLog = consoleLogs.find(log => 
      log.includes('오류') || 
      log.includes('error') || 
      log.includes('실패')
    );
    
    expect(errorLog).toBeDefined();
  });

  test('should validate data persistence across page reloads', async ({ page }) => {
    // 초기 매물 수 확인
    await page.waitForSelector('#dataTable tbody tr');
    const initialCount = await page.locator('#dataTable tbody tr').count();
    
    // 새 매물 생성
    await page.click('.btn-primary');
    await page.waitForSelector('#propertyForm');
    
    const testName = `지속성 테스트 ${Date.now()}`;
    await page.selectOption('#manager', '박소현');
    await page.selectOption('#status', '거래가능');
    await page.fill('#propertyName', testName);
    
    await page.click('.btn-save');
    await page.waitForTimeout(500);
    const confirmBtn = page.locator('#confirmBtn');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
    await page.waitForTimeout(3000);
    
    // 페이지 새로고침
    await page.reload();
    await page.waitForTimeout(3000);
    
    // 매물 수가 증가했는지 확인
    await page.waitForSelector('#dataTable tbody tr');
    const newCount = await page.locator('#dataTable tbody tr').count();
    expect(newCount).toBeGreaterThan(initialCount);
    
    // 생성한 매물이 여전히 존재하는지 확인
    const tableContent = await page.locator('#dataTable tbody').textContent();
    expect(tableContent).toContain(testName);
  });

  test('should verify real-time data sync functionality', async ({ page }) => {
    // 실시간 구독 상태 확인
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });
    
    await page.waitForTimeout(2000);
    
    // 실시간 구독 관련 로그 확인
    const realtimeLog = consoleLogs.find(log => 
      log.includes('실시간 구독') || 
      log.includes('realtime') ||
      log.includes('subscription')
    );
    
    // 실시간 기능이 활성화되어 있는지 확인
    expect(realtimeLog).toBeDefined();
  });
});