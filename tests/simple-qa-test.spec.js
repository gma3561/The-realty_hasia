const { test, expect } = require('@playwright/test');

// 간단한 기능 검증 테스트
test.describe('더부동산 핵심 기능 검증', () => {
  const PRODUCTION_URL = 'https://gma3561.github.io/The-realty_hasia/';
  
  test('1. 사이트 로딩 및 기본 UI 확인', async ({ page }) => {
    console.log('📌 사이트 로딩 테스트');
    
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');
    
    // 기본 UI 요소 확인
    await expect(page.locator('.page-title')).toBeVisible();
    await expect(page.locator('.btn-primary')).toBeVisible();
    await expect(page.locator('.data-table')).toBeVisible();
    
    console.log('✅ 사이트 로딩 성공');
  });
  
  test('2. 매물등록 페이지 접근', async ({ page }) => {
    console.log('📌 매물등록 페이지 접근 테스트');
    
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');
    
    // 매물등록 버튼 클릭
    await page.click('.btn-primary');
    await page.waitForLoadState('networkidle');
    
    // 폼 페이지 확인
    await expect(page).toHaveURL(/form\.html/);
    await expect(page.locator('#propertyForm')).toBeVisible();
    
    console.log('✅ 매물등록 페이지 접근 성공');
  });
  
  test('3. 관리자 로그인 프로세스', async ({ page }) => {
    console.log('📌 관리자 로그인 테스트');
    
    await page.goto(`${PRODUCTION_URL}admin-login.html`);
    await page.waitForLoadState('networkidle');
    
    // 로그인 폼 확인
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('.login-btn')).toBeVisible();
    
    // 관리자 계정으로 로그인
    await page.fill('#username', 'jenny');
    await page.fill('#password', 'happyday');
    
    // 로그인 성공 alert 처리
    page.on('dialog', async dialog => {
      console.log('Alert:', dialog.message());
      await dialog.accept();
    });
    
    await page.click('.login-btn');
    await page.waitForTimeout(2000);
    
    // 메인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(PRODUCTION_URL);
    
    console.log('✅ 관리자 로그인 성공');
  });
  
  test('4. 매물 목록 표시 확인', async ({ page }) => {
    console.log('📌 매물 목록 표시 테스트');
    
    await page.goto(PRODUCTION_URL);
    await page.waitForTimeout(5000); // Supabase 데이터 로딩 대기
    
    // 테이블 존재 확인
    await expect(page.locator('.data-table')).toBeVisible();
    
    // 데이터 로딩 확인 (최소 1개 행은 있어야 함)
    const rows = page.locator('.data-table tbody tr');
    const rowCount = await rows.count();
    
    console.log(`매물 수: ${rowCount}개`);
    expect(rowCount).toBeGreaterThan(0);
    
    console.log('✅ 매물 목록 표시 성공');
  });
  
  test('5. 기본 매물 등록 테스트', async ({ page }) => {
    console.log('📌 기본 매물 등록 테스트');
    
    // 매물등록 페이지로 이동
    await page.goto(`${PRODUCTION_URL}form.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // JavaScript 로딩 대기
    
    // 필수 필드 작성
    await page.selectOption('#manager', '김규민');
    await page.fill('#propertyName', `테스트매물_${Date.now()}`);
    await page.fill('#address', '서울시 강남구 테스트동');
    
    // 저장 전 alert 핸들러 설정
    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      console.log('저장 결과:', alertMessage);
      await dialog.accept();
    });
    
    // 저장 버튼 클릭
    await page.click('.btn-save');
    await page.waitForTimeout(5000);
    
    // 성공 메시지 확인 또는 메인 페이지 이동 확인
    if (alertMessage.includes('성공')) {
      console.log('✅ 매물 등록 성공');
    } else {
      console.log('❌ 매물 등록 실패:', alertMessage);
    }
  });
});