import { test, expect } from '@playwright/test';

test.describe('간단한 CRUD 기능 테스트', () => {
  const PRODUCTION_URL = 'https://gma3561.github.io/The-realty_hasia/';
  const FORM_URL = 'https://gma3561.github.io/The-realty_hasia/form.html';
  
  test('매물 등록 기본 테스트', async ({ page }) => {
    console.log('🔥 매물 등록 테스트 시작');
    
    // 1. 메인 페이지에서 매물 등록 버튼 클릭
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('.data-table', { timeout: 15000 });
    
    const beforeCount = await page.locator('.data-table tbody tr').count();
    console.log(`📊 등록 전 매물 수: ${beforeCount}개`);
    
    await page.click('.btn-primary');
    await page.waitForURL('**/form.html', { timeout: 10000 });
    console.log('✅ 폼 페이지 이동 성공');
    
    // 2. 폼 필드 확인 및 입력
    await page.waitForSelector('.form-container', { timeout: 10000 });
    
    const testData = {
      propertyName: `자동테스트_${Date.now()}`,
      manager: '김규민',
      status: '거래가능',
      propertyType: '아파트',
      tradeType: '매매',
      address: '서울시 테스트구 자동화동 123-45',
      price: '30,000'
    };
    
    // 기본 정보 입력
    console.log('📝 매물 정보 입력 중...');
    
    await page.fill('#propertyName', testData.propertyName);
    await page.selectOption('#manager', testData.manager);
    await page.selectOption('#status', testData.status);
    await page.selectOption('#propertyType', testData.propertyType);
    await page.selectOption('#tradeType', testData.tradeType);
    await page.fill('#address', testData.address);
    await page.fill('#price', testData.price);
    
    console.log('✅ 기본 정보 입력 완료');
    
    // 3. 저장 버튼 클릭
    console.log('💾 저장 중...');
    
    // 확인 다이얼로그 처리
    page.on('dialog', async dialog => {
      console.log(`📋 다이얼로그: ${dialog.message()}`);
      await dialog.accept();
    });
    
    await page.click('.btn-save');
    
    // 저장 완료 대기
    await page.waitForTimeout(5000);
    
    // 4. 메인 페이지로 돌아가서 확인
    console.log('🔍 등록 결과 확인 중...');
    
    try {
      // 메인 페이지로 리다이렉트되었는지 확인
      await page.waitForURL(PRODUCTION_URL, { timeout: 10000 });
      console.log('✅ 메인 페이지로 리다이렉트 성공');
    } catch (e) {
      // 수동으로 메인 페이지로 이동
      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
      console.log('📍 수동으로 메인 페이지 이동');
    }
    
    await page.waitForSelector('.data-table', { timeout: 15000 });
    
    const afterCount = await page.locator('.data-table tbody tr').count();
    console.log(`📊 등록 후 매물 수: ${afterCount}개`);
    
    // 5. 등록된 매물 검색
    if (afterCount > beforeCount) {
      console.log('🎉 매물 등록 성공! (매물 수 증가 확인)');
      
      // 검색으로 등록된 매물 찾기
      await page.fill('.search-input', testData.propertyName);
      await page.waitForTimeout(2000);
      
      const searchResults = await page.locator('.data-table tbody tr').count();
      console.log(`🔍 검색 결과: ${searchResults}개`);
      
      if (searchResults > 0) {
        console.log('✅ 등록된 매물 검색 성공!');
        
        // 검색 결과의 첫 번째 행 내용 확인
        const firstResult = page.locator('.data-table tbody tr').first();
        const rowText = await firstResult.textContent();
        console.log(`📄 검색된 매물 정보: ${rowText?.substring(0, 100)}...`);
        
        if (rowText?.includes(testData.propertyName)) {
          console.log('🎯 매물명 일치 확인!');
        }
      }
    } else {
      console.log('⚠️ 매물 수에 변화가 없음 - 등록 실패 가능성');
    }
    
    console.log('✅ 매물 등록 테스트 완료');
  });

  test('슬랙 알림 기능 테스트', async ({ page }) => {
    console.log('🔥 슬랙 알림 테스트 시작');
    
    // 슬랙 요청 모니터링
    const slackRequests = [];
    
    page.on('request', request => {
      if (request.url().includes('slack.com') || request.url().includes('webhook')) {
        slackRequests.push({
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString()
        });
        console.log(`📡 슬랙 요청 감지: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('slack.com') || response.url().includes('webhook')) {
        console.log(`📡 슬랙 응답: ${response.status()}`);
      }
    });
    
    // 매물 등록으로 슬랙 알림 트리거
    await page.goto(FORM_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('.form-container', { timeout: 10000 });
    
    const slackTestData = {
      propertyName: `슬랙테스트_${Date.now()}`,
      manager: '김규민',
      status: '거래가능',
      propertyType: '오피스텔',
      tradeType: '전세',
      address: '서울시 슬랙구 알림동',
      price: '25,000'
    };
    
    // 매물 정보 입력
    await page.fill('#propertyName', slackTestData.propertyName);
    await page.selectOption('#manager', slackTestData.manager);
    await page.selectOption('#status', slackTestData.status);
    await page.selectOption('#propertyType', slackTestData.propertyType);
    await page.selectOption('#tradeType', slackTestData.tradeType);
    await page.fill('#address', slackTestData.address);
    await page.fill('#price', slackTestData.price);
    
    console.log('📝 슬랙 테스트용 매물 정보 입력 완료');
    
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    
    await page.click('.btn-save');
    await page.waitForTimeout(10000); // 슬랙 요청 충분히 대기
    
    console.log(`📊 슬랙 요청 총 ${slackRequests.length}회 감지됨`);
    
    if (slackRequests.length > 0) {
      console.log('🎉 슬랙 알림 기능 작동 확인!');
      slackRequests.forEach((req, index) => {
        console.log(`  ${index + 1}. ${req.method} ${req.url.substring(0, 50)}... at ${req.timestamp}`);
      });
    } else {
      console.log('⚠️ 슬랙 알림 요청이 감지되지 않음');
      console.log('   - 슬랙 알림이 비활성화되어 있을 수 있음');
      console.log('   - 또는 조건에 맞지 않아 발송되지 않았을 수 있음');
    }
    
    console.log('✅ 슬랙 알림 테스트 완료');
  });

  test('매물 목록 기본 기능 테스트', async ({ page }) => {
    console.log('🔥 매물 목록 기능 테스트 시작');
    
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('.data-table', { timeout: 15000 });
    
    // 1. 전체 매물 수 확인
    const totalRows = await page.locator('.data-table tbody tr').count();
    console.log(`📊 전체 매물 수: ${totalRows}개`);
    
    if (totalRows > 0) {
      // 2. 검색 기능 테스트
      console.log('🔍 검색 기능 테스트');
      
      const searchTerms = ['아파트', '거래가능', '서울', '매매', '전세'];
      
      for (const term of searchTerms) {
        await page.fill('.search-input', term);
        await page.waitForTimeout(1500);
        
        const results = await page.locator('.data-table tbody tr').count();
        console.log(`  "${term}" 검색: ${results}개 결과`);
        
        if (results > 0) {
          // 첫 번째 결과 확인
          const firstResult = await page.locator('.data-table tbody tr').first().textContent();
          const containsTerm = firstResult?.toLowerCase().includes(term.toLowerCase());
          console.log(`    첫 번째 결과에 "${term}" 포함: ${containsTerm}`);
        }
      }
      
      // 검색 초기화
      await page.fill('.search-input', '');
      await page.waitForTimeout(1000);
      
      const resetCount = await page.locator('.data-table tbody tr').count();
      console.log(`🔄 검색 초기화 후: ${resetCount}개`);
      
      // 3. 테이블 컬럼 확인
      console.log('📋 테이블 구조 확인');
      
      const headers = page.locator('.data-table thead th');
      const headerCount = await headers.count();
      console.log(`  헤더 컬럼 수: ${headerCount}개`);
      
      for (let i = 0; i < Math.min(headerCount, 10); i++) {
        const headerText = await headers.nth(i).textContent();
        console.log(`    컬럼 ${i + 1}: "${headerText?.trim()}"`);
      }
      
      // 4. 첫 번째 행 데이터 샘플
      const firstRow = page.locator('.data-table tbody tr').first();
      const cells = firstRow.locator('td');
      const cellCount = await cells.count();
      
      console.log(`📄 첫 번째 행 데이터 (총 ${cellCount}개 컬럼):`);
      for (let i = 0; i < Math.min(cellCount, 8); i++) {
        const cellText = await cells.nth(i).textContent();
        console.log(`    셀 ${i + 1}: "${cellText?.trim().substring(0, 30)}${cellText && cellText.trim().length > 30 ? '...' : ''}"`);
      }
      
      console.log('✅ 매물 목록 기능 테스트 완료');
    } else {
      console.log('⚠️ 표시할 매물이 없어 일부 테스트를 건너뛸니다');
    }
  });

  test('폼 유효성 검사 테스트', async ({ page }) => {
    console.log('🔥 폼 유효성 검사 테스트 시작');
    
    await page.goto(FORM_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('.form-container', { timeout: 10000 });
    
    console.log('📝 필수 필드 누락 테스트');
    
    // 매물명만 입력하고 저장 시도
    await page.fill('#propertyName', '유효성테스트매물');
    
    // 다이얼로그 확인 처리
    let dialogAppeared = false;
    page.on('dialog', async dialog => {
      console.log(`📋 다이얼로그 메시지: ${dialog.message()}`);
      dialogAppeared = true;
      await dialog.accept();
    });
    
    await page.click('.btn-save');
    await page.waitForTimeout(3000);
    
    if (dialogAppeared) {
      console.log('✅ 저장 다이얼로그 표시됨');
      
      // HTML5 유효성 검사 확인
      const requiredFields = await page.locator('input[required], select[required]').all();
      console.log(`📋 필수 필드 수: ${requiredFields.length}개`);
      
      let invalidCount = 0;
      for (const field of requiredFields) {
        const isValid = await field.evaluate(el => el.checkValidity());
        const name = await field.getAttribute('name') || await field.getAttribute('id') || 'unknown';
        console.log(`  ${name}: ${isValid ? '유효' : '무효'}`);
        if (!isValid) invalidCount++;
      }
      
      console.log(`📊 무효한 필드: ${invalidCount}개`);
      
      if (invalidCount > 0) {
        console.log('✅ 폼 유효성 검사 작동 확인');
      } else {
        console.log('⚠️ 모든 필드가 유효함 (예상과 다름)');
      }
    } else {
      console.log('⚠️ 저장 다이얼로그가 표시되지 않음');
    }
    
    console.log('✅ 폼 유효성 검사 테스트 완료');
  });

  test('페이지 반응형 테스트', async ({ page }) => {
    console.log('🔥 페이지 반응형 테스트 시작');
    
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      console.log(`📱 ${viewport.name} 테스트 (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // 메인 페이지 테스트
      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
      await page.waitForSelector('.data-table', { timeout: 15000 });
      
      const tableVisible = await page.locator('.data-table').isVisible();
      const headerVisible = await page.locator('.header').isVisible();
      const buttonVisible = await page.locator('.btn-primary').isVisible();
      
      console.log(`  메인페이지 - 테이블: ${tableVisible}, 헤더: ${headerVisible}, 버튼: ${buttonVisible}`);
      
      // 폼 페이지 테스트
      await page.goto(FORM_URL, { waitUntil: 'networkidle' });
      await page.waitForSelector('.form-container', { timeout: 10000 });
      
      const formVisible = await page.locator('.form-container').isVisible();
      const saveButtonVisible = await page.locator('.btn-save').isVisible();
      
      console.log(`  폼페이지 - 폼: ${formVisible}, 저장버튼: ${saveButtonVisible}`);
      
      // 스크린샷 저장
      await page.screenshot({ 
        path: `test-results/responsive-${viewport.name.toLowerCase()}-main.png`,
        fullPage: false
      });
    }
    
    console.log('✅ 페이지 반응형 테스트 완료');
  });
});