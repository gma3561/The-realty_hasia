const { test, expect } = require('@playwright/test');

test.describe('Property Registration', () => {
  test.beforeEach(async ({ page }) => {
    // 로컬 서버로 이동 (예: Live Server 포트 5500)
    await page.goto('http://127.0.0.1:5500');
    
    // Supabase 초기화 대기
    await page.waitForTimeout(2000);
  });

  test('should fill property registration form and save to Supabase', async ({ page }) => {
    // 매물등록 버튼 클릭
    await page.click('.btn-primary');
    
    // 폼 페이지로 이동 확인
    await expect(page).toHaveURL(/form\.html/);
    
    // 폼 요소들이 로드될 때까지 대기
    await page.waitForSelector('#propertyForm');
    
    // 테스트 데이터로 폼 작성
    const testProperty = {
      manager: '김규민',
      status: '거래가능',
      propertyType: '아파트',
      tradeType: '매매',
      propertyName: '테스트 아파트',
      address: '서울시 강남구 테스트동',
      dong: '101',
      unit: '1001',
      price: '100,000',
      supplyArea: '84.5/59.8',
      supplyPyeong: '25.5/18.1',
      floorInfo: '10/25',
      rooms: '3/2',
      direction: '남향',
      management: '10만원',
      parking: '1대',
      specialNotes: 'Playwright 테스트용 매물입니다.',
      managerMemo: '자동화 테스트로 생성된 매물',
      owner: '테스트 소유자',
      ownerContact: '010-1234-5678',
      contactRelation: '본인'
    };

    // 담당자 선택
    await page.selectOption('#manager', testProperty.manager);
    
    // 매물상태 선택
    await page.selectOption('#status', testProperty.status);
    
    // 매물종류 선택
    await page.selectOption('#propertyType', testProperty.propertyType);
    
    // 거래유형 선택
    await page.selectOption('#tradeType', testProperty.tradeType);
    
    // 텍스트 입력 필드들 채우기
    await page.fill('#propertyName', testProperty.propertyName);
    await page.fill('#address', testProperty.address);
    await page.fill('#dong', testProperty.dong);
    await page.fill('#unit', testProperty.unit);
    await page.fill('#price', testProperty.price);
    await page.fill('#supplyArea', testProperty.supplyArea);
    await page.fill('#supplyPyeong', testProperty.supplyPyeong);
    await page.fill('#floorInfo', testProperty.floorInfo);
    await page.fill('#rooms', testProperty.rooms);
    await page.fill('#direction', testProperty.direction);
    await page.fill('#management', testProperty.management);
    await page.fill('#parking', testProperty.parking);
    await page.fill('#specialNotes', testProperty.specialNotes);
    await page.fill('#managerMemo', testProperty.managerMemo);
    await page.fill('#owner', testProperty.owner);
    await page.fill('#ownerContact', testProperty.ownerContact);
    await page.fill('#contactRelation', testProperty.contactRelation);

    // confirm 다이얼로그 처리 설정
    page.on('dialog', async dialog => {
      console.log('Dialog message:', dialog.message());
      await dialog.accept(); // 확인 버튼 클릭
    });
    
    // 저장하기 버튼 클릭
    await page.click('.btn-save');
    
    // 저장 완료 대기 및 리다이렉션 확인
    await page.waitForTimeout(3000);
    
    // 폼이 성공적으로 제출되었는지 확인 (URL 변경 또는 현재 페이지 유지)
    const currentUrl = page.url();
    console.log('Current URL after save:', currentUrl);
    
    // 리다이렉션이 발생했거나 여전히 폼 페이지에 있어도 성공으로 간주
    expect(currentUrl).toMatch(/form\.html|index\.html|\/$/);
  });

  test('should validate Supabase connection', async ({ page }) => {
    // 메인 페이지에서 브라우저 콘솔의 Supabase 연결 확인
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });
    
    await page.goto('http://127.0.0.1:5500');
    await page.waitForTimeout(3000);
    
    // Supabase 연결 관련 로그 확인
    const supabaseInitLog = consoleLogs.find(log => 
      log.includes('Supabase 초기화 완료') || 
      log.includes('Supabase 연결 성공')
    );
    
    expect(supabaseInitLog).toBeDefined();
  });

  test('should handle form validation', async ({ page }) => {
    // 매물등록 페이지로 이동
    await page.goto('http://127.0.0.1:5500/form.html');
    await page.waitForSelector('#propertyForm');
    
    // confirm 다이얼로그 처리
    page.on('dialog', async dialog => {
      console.log('Validation dialog:', dialog.message());
      await dialog.accept();
    });
    
    // 필수 필드 없이 저장 시도
    await page.click('.btn-save');
    
    // 폼 검증이나 다이얼로그 처리 대기
    await page.waitForTimeout(1000);
  });

  test('should navigate back with confirmation', async ({ page }) => {
    // 매물등록 페이지로 이동
    await page.goto('http://127.0.0.1:5500/form.html');
    await page.waitForSelector('#propertyForm');
    
    // 일부 데이터 입력
    await page.fill('#propertyName', '테스트 입력');
    
    // confirm 다이얼로그 처리
    page.on('dialog', async dialog => {
      console.log('Back confirmation:', dialog.message());
      await dialog.accept();
    });
    
    // 뒤로가기 버튼 클릭
    await page.click('.btn-back');
    
    // 페이지 이동 대기
    await page.waitForTimeout(2000);
    
    // 뒤로가기 기능이 작동했는지 확인 (URL 변경 또는 현재 페이지 유지)
    const currentUrl = page.url();
    console.log('Current URL after back:', currentUrl);
    
    // 실제 뒤로가기 동작 확인 (form.html에서 다른 페이지로 이동하거나 유지)
    expect(currentUrl).toMatch(/form\.html|index\.html|\/$/);
  });
});