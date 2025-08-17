const { test, expect } = require('@playwright/test');

test.describe('더블클릭 수정 디버깅', () => {
  const LOCAL_URL = 'http://localhost:8888/';
  
  test('더블클릭 이벤트 및 페이지 이동 테스트', async ({ page }) => {
    console.log('📌 더블클릭 수정 디버깅 시작');
    
    // 콘솔 메시지 모니터링
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('더블클릭') || text.includes('editProperty') || text.includes('data-id')) {
        console.log('🔍 콘솔:', msg.type(), '-', text);
      }
    });
    
    // 페이지 네비게이션 이벤트 모니터링
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) {
        console.log('📍 페이지 이동:', frame.url());
      }
    });
    
    // 1. 관리자 로그인
    await page.goto(`${LOCAL_URL}admin-login.html`);
    await page.fill('#username', 'jenny');
    await page.fill('#password', 'happyday');
    
    page.on('dialog', async dialog => {
      console.log('Dialog:', dialog.message());
      await dialog.accept();
    });
    
    await page.click('.login-btn');
    await page.waitForTimeout(2000);
    
    // 2. 메인 페이지로 이동
    await page.goto(LOCAL_URL);
    await page.waitForTimeout(5000);
    
    // 3. 첫 번째 행의 data-id 확인
    const firstRow = page.locator('.data-table tbody tr').first();
    
    if (await firstRow.count() > 0) {
      // data-id 속성 확인
      const dataId = await firstRow.getAttribute('data-id');
      console.log('✅ 첫 번째 행의 data-id:', dataId);
      
      // 관리자 로그인 상태 확인
      const isAdmin = await page.evaluate(() => {
        return sessionStorage.getItem('admin_logged_in') === 'true';
      });
      console.log('✅ 관리자 로그인 상태:', isAdmin);
      
      // 더블클릭 실행
      console.log('🖱️ 더블클릭 실행 중...');
      await firstRow.dblclick();
      
      // 페이지 이동 대기
      await page.waitForTimeout(3000);
      
      // 현재 URL 확인
      const currentUrl = page.url();
      console.log('📍 현재 URL:', currentUrl);
      
      if (currentUrl.includes('form.html')) {
        console.log('✅ 수정 페이지 진입 성공!');
        
        // URL 파라미터 확인
        const urlObj = new URL(currentUrl);
        const editId = urlObj.searchParams.get('edit');
        console.log('✅ edit 파라미터:', editId);
        
        // 데이터 로드 확인
        await page.waitForTimeout(2000);
        const propertyName = await page.locator('#propertyName').inputValue();
        if (propertyName) {
          console.log('✅ 매물명 로드됨:', propertyName);
        } else {
          console.log('⚠️ 매물명이 비어있음');
        }
      } else {
        console.log('❌ 수정 페이지 진입 실패');
        console.log('현재 페이지 타이틀:', await page.title());
        
        // 에러 메시지 확인
        const pageContent = await page.locator('body').textContent();
        if (pageContent.includes('404') || pageContent.includes('Not Found')) {
          console.log('❌ 404 에러 발생');
        }
      }
    } else {
      console.log('⚠️ 테이블에 데이터가 없습니다');
    }
  });
  
  test('editProperty 함수 직접 호출 테스트', async ({ page }) => {
    console.log('📌 editProperty 함수 직접 호출 테스트');
    
    // 관리자 로그인
    await page.goto(`${LOCAL_URL}admin-login.html`);
    await page.fill('#username', 'jenny');
    await page.fill('#password', 'happyday');
    
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    
    await page.click('.login-btn');
    await page.waitForTimeout(2000);
    
    // 메인 페이지로 이동
    await page.goto(LOCAL_URL);
    await page.waitForTimeout(5000);
    
    // editProperty 함수 직접 호출
    const result = await page.evaluate(() => {
      // 첫 번째 매물 ID 가져오기
      const firstRow = document.querySelector('.data-table tbody tr');
      if (firstRow) {
        const id = firstRow.getAttribute('data-id');
        console.log('ID found:', id);
        
        // editProperty 함수 확인
        if (typeof window.editProperty === 'function') {
          console.log('editProperty 함수 존재함');
          // 실제 호출은 페이지 이동을 발생시키므로 여기서는 확인만
          return { success: true, id: id };
        } else {
          console.log('editProperty 함수가 없음');
          return { success: false, error: 'Function not found' };
        }
      }
      return { success: false, error: 'No data' };
    });
    
    console.log('함수 호출 결과:', result);
    
    if (result.success && result.id) {
      // 직접 페이지 이동
      await page.goto(`${LOCAL_URL}form.html?edit=${result.id}`);
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log('직접 이동 후 URL:', currentUrl);
      
      // 데이터 로드 확인
      const propertyName = await page.locator('#propertyName').inputValue();
      if (propertyName) {
        console.log('✅ 직접 이동 성공, 매물명:', propertyName);
      } else {
        console.log('⚠️ 직접 이동했지만 데이터 로드 실패');
      }
    }
  });
});