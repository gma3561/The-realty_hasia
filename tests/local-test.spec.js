const { test, expect } = require('@playwright/test');

// 로컬 서버에서 CRUD 테스트
test.describe('로컬 CRUD 테스트', () => {
  const LOCAL_URL = 'http://localhost:8888/';
  
  test('1. 매물 등록 - 로컬 테스트', async ({ page }) => {
    console.log('📌 로컬 매물 등록 테스트');
    
    // 콘솔 메시지 출력
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ 콘솔 에러:', msg.text());
      } else if (msg.text().includes('saveProperty') || msg.text().includes('form-script')) {
        console.log('📝', msg.text());
      }
    });
    
    // form.html 접속
    await page.goto(`${LOCAL_URL}form.html`);
    await page.waitForTimeout(3000);
    
    // 전역 함수 확인
    const globalCheck = await page.evaluate(() => {
      return {
        saveProperty: typeof window.saveProperty,
        supabaseClient: !!window.supabaseClient,
        insertProperty: typeof window.insertProperty
      };
    });
    
    console.log('전역 객체 상태:', globalCheck);
    
    // 테스트 데이터 입력
    const timestamp = Date.now();
    const testData = {
      propertyName: `로컬테스트_${timestamp}`,
      manager: '김규민',
      address: `서울시 로컬구 테스트동 ${timestamp}`,
      price: Math.floor(Math.random() * 100000) + ''
    };
    
    await page.fill('#propertyName', testData.propertyName);
    await page.selectOption('#manager', testData.manager);
    await page.fill('#address', testData.address);
    await page.fill('#price', testData.price);
    
    // Alert 처리
    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      console.log('Alert:', alertMessage);
      await dialog.accept();
    });
    
    // 저장 버튼 클릭
    console.log('저장 버튼 클릭');
    await page.click('.btn-save');
    await page.waitForTimeout(1000);
    
    // 확인 모달의 확인 버튼 클릭
    const confirmModal = page.locator('#confirmModal');
    if (await confirmModal.isVisible()) {
      console.log('확인 모달 표시됨');
      await page.click('#confirmBtn');
    }
    
    await page.waitForTimeout(5000);
    
    // 결과 확인
    if (alertMessage.includes('성공')) {
      console.log('✅ 매물 등록 성공!');
    } else {
      console.log('❌ 매물 등록 실패:', alertMessage);
    }
  });
  
  test('2. 더블클릭 수정 - 로컬 테스트', async ({ page }) => {
    console.log('📌 로컬 더블클릭 수정 테스트');
    
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
    
    // 첫 번째 매물 더블클릭
    const firstRow = page.locator('.data-table tbody tr').first();
    
    if (await firstRow.count() > 0) {
      console.log('매물 더블클릭');
      await firstRow.dblclick();
      await page.waitForTimeout(2000);
      
      // URL 확인
      const currentUrl = page.url();
      if (currentUrl.includes('form.html')) {
        console.log('✅ 더블클릭 수정 페이지 진입 성공!');
        
        // 데이터 로드 확인
        const propertyName = await page.locator('#propertyName').inputValue();
        if (propertyName) {
          console.log('✅ 기존 데이터 로드 성공:', propertyName);
        }
      } else {
        console.log('❌ 수정 페이지 진입 실패');
      }
    } else {
      console.log('⚠️ 테스트할 매물이 없음');
    }
  });
  
  test('3. 매물 삭제 - 로컬 테스트', async ({ page }) => {
    console.log('📌 로컬 매물 삭제 테스트');
    
    // 관리자 로그인
    await page.goto(`${LOCAL_URL}admin-login.html`);
    await page.fill('#username', 'jenny');
    await page.fill('#password', 'happyday');
    
    page.on('dialog', async dialog => {
      console.log('Dialog:', dialog.message());
      await dialog.accept();
    });
    
    await page.click('.login-btn');
    await page.waitForTimeout(2000);
    
    // 메인 페이지로 이동
    await page.goto(LOCAL_URL);
    await page.waitForTimeout(5000);
    
    // 첫 번째 매물의 삭제 버튼 클릭
    const firstRow = page.locator('.data-table tbody tr').first();
    
    if (await firstRow.count() > 0) {
      const deleteButton = firstRow.locator('.btn-delete');
      
      if (await deleteButton.count() > 0) {
        const initialCount = await page.locator('.data-table tbody tr').count();
        console.log(`삭제 전 매물 수: ${initialCount}`);
        
        console.log('삭제 버튼 클릭');
        await deleteButton.click();
        await page.waitForTimeout(1000);
        
        // 모달 확인
        const modal = page.locator('#deleteConfirmModal');
        if (await modal.isVisible()) {
          console.log('✅ 삭제 확인 모달 표시됨');
          
          // 삭제 확인 클릭
          const confirmButton = modal.locator('button:has-text("삭제")');
          await confirmButton.click();
          await page.waitForTimeout(3000);
          
          const finalCount = await page.locator('.data-table tbody tr').count();
          console.log(`삭제 후 매물 수: ${finalCount}`);
          
          if (finalCount < initialCount) {
            console.log('✅ 매물 삭제 성공!');
          } else {
            console.log('❌ 매물 삭제 실패');
          }
        } else {
          console.log('❌ 삭제 모달이 표시되지 않음');
        }
      } else {
        console.log('❌ 삭제 버튼을 찾을 수 없음');
      }
    } else {
      console.log('⚠️ 삭제할 매물이 없음');
    }
  });
});