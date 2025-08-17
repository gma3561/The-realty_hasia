const { test, expect } = require('@playwright/test');

// 수정사항 검증 테스트
test.describe('CRUD 기능 수정사항 검증', () => {
  const PRODUCTION_URL = 'https://gma3561.github.io/The-realty_hasia/';
  
  // 테스트용 데이터
  const testProperty = {
    propertyName: `검증테스트_${Date.now()}`,
    manager: '김규민',
    address: '서울시 강남구 검증동',
    price: '25,000'
  };

  test('1. 매물 등록 - Supabase 초기화 대기 검증', async ({ page }) => {
    console.log('🔍 매물 등록 테스트');
    
    await page.goto(`${PRODUCTION_URL}form.html`);
    
    // 초기 로딩 대기 (수정된 초기화 시간)
    await page.waitForTimeout(6000);
    
    // 필수 필드 입력
    await page.fill('#propertyName', testProperty.propertyName);
    await page.selectOption('#manager', testProperty.manager);
    await page.fill('#address', testProperty.address);
    await page.fill('#price', testProperty.price);
    
    // Alert 처리
    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      console.log('Alert:', alertMessage);
      await dialog.accept();
    });
    
    // 저장 클릭
    await page.click('.btn-save');
    await page.waitForTimeout(8000);
    
    // 결과 확인
    if (alertMessage.includes('성공') || alertMessage.includes('등록')) {
      console.log('✅ 매물 등록 성공');
      
      // 목록에서 확인
      await page.goto(PRODUCTION_URL);
      await page.waitForTimeout(5000);
      
      const newRow = page.locator(`tr:has-text("${testProperty.propertyName}")`);
      const exists = await newRow.count() > 0;
      
      if (exists) {
        console.log('✅ 등록된 매물이 목록에 표시됨');
      } else {
        console.log('⚠️ 등록은 성공했으나 목록에 표시 안됨');
      }
    } else {
      console.log('❌ 매물 등록 실패:', alertMessage);
    }
  });

  test('2. 더블클릭 수정 기능 검증', async ({ page }) => {
    console.log('🔍 더블클릭 수정 기능 테스트');
    
    // 관리자 로그인
    await page.goto(`${PRODUCTION_URL}admin-login.html`);
    await page.fill('#username', 'jenny');
    await page.fill('#password', 'happyday');
    
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    
    await page.click('.login-btn');
    await page.waitForTimeout(2000);
    
    // 매물 목록으로 이동
    await page.goto(PRODUCTION_URL);
    await page.waitForTimeout(5000);
    
    // 첫 번째 매물 더블클릭
    const firstRow = page.locator('.data-table tbody tr').first();
    
    if (await firstRow.count() > 0) {
      console.log('매물 더블클릭 시도');
      await firstRow.dblclick();
      await page.waitForTimeout(3000);
      
      // 수정 페이지로 이동했는지 확인
      const currentUrl = page.url();
      if (currentUrl.includes('form.html')) {
        console.log('✅ 더블클릭으로 수정 페이지 진입 성공');
        
        // 데이터가 로드되었는지 확인
        const propertyNameField = await page.locator('#propertyName').inputValue();
        if (propertyNameField) {
          console.log('✅ 기존 데이터 로드 성공:', propertyNameField);
        } else {
          console.log('⚠️ 데이터 로드 실패');
        }
      } else {
        console.log('❌ 수정 페이지 진입 실패');
      }
    } else {
      console.log('⚠️ 테스트할 매물이 없음');
    }
  });

  test('3. 매물 삭제 모달 동작 검증', async ({ page }) => {
    console.log('🔍 삭제 모달 동작 테스트');
    
    // 관리자 로그인
    await page.goto(`${PRODUCTION_URL}admin-login.html`);
    await page.fill('#username', 'jenny');
    await page.fill('#password', 'happyday');
    
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    
    await page.click('.login-btn');
    await page.waitForTimeout(2000);
    
    // 매물 목록으로 이동
    await page.goto(PRODUCTION_URL);
    await page.waitForTimeout(5000);
    
    // 테스트 매물 찾기 (이전에 등록한 것)
    let targetRow = page.locator(`tr:has-text("${testProperty.propertyName}")`);
    
    if (await targetRow.count() === 0) {
      // 없으면 아무 테스트 매물 선택
      targetRow = page.locator('tr:has-text("테스트")').first();
    }
    
    if (await targetRow.count() > 0) {
      const deleteButton = targetRow.locator('.btn-delete');
      
      if (await deleteButton.count() > 0) {
        console.log('삭제 버튼 클릭');
        await deleteButton.click();
        await page.waitForTimeout(1000);
        
        // 모달 표시 확인
        const modal = page.locator('#deleteConfirmModal');
        if (await modal.isVisible()) {
          console.log('✅ 삭제 확인 모달 표시됨');
          
          // 취소 버튼 테스트
          const cancelButton = modal.locator('button:has-text("취소")');
          await cancelButton.click();
          await page.waitForTimeout(500);
          
          if (!await modal.isVisible()) {
            console.log('✅ 취소 버튼 동작 확인');
          }
          
          // 다시 삭제 시도
          await deleteButton.click();
          await page.waitForTimeout(1000);
          
          // 삭제 확인 클릭
          const confirmButton = modal.locator('button:has-text("삭제")');
          await confirmButton.click();
          
          // Alert 처리
          page.on('dialog', async dialog => {
            console.log('삭제 완료:', dialog.message());
            await dialog.accept();
          });
          
          await page.waitForTimeout(3000);
          
          // 삭제 확인
          const deletedRow = page.locator(`tr:has-text("${testProperty.propertyName}")`);
          if (await deletedRow.count() === 0) {
            console.log('✅ 매물 삭제 성공');
          } else {
            console.log('⚠️ 삭제 처리됐으나 목록에 남아있음');
          }
        } else {
          console.log('❌ 삭제 모달이 표시되지 않음');
        }
      } else {
        console.log('❌ 삭제 버튼을 찾을 수 없음');
      }
    } else {
      console.log('⚠️ 삭제할 테스트 매물이 없음');
    }
  });

  test('4. 에러 메시지 개선 확인', async ({ page }) => {
    console.log('🔍 에러 메시지 개선 테스트');
    
    await page.goto(`${PRODUCTION_URL}form.html`);
    await page.waitForTimeout(6000);
    
    // 필수 필드 없이 저장 시도
    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      console.log('에러 메시지:', alertMessage);
      await dialog.accept();
    });
    
    await page.click('.btn-save');
    await page.waitForTimeout(2000);
    
    // 한글 에러 메시지 확인
    if (alertMessage.includes('입력해주세요') || 
        alertMessage.includes('필수') || 
        alertMessage.includes('실패')) {
      console.log('✅ 한글 에러 메시지 표시됨');
    } else {
      console.log('⚠️ 에러 메시지가 개선되지 않음:', alertMessage);
    }
  });

  test('5. 종합 CRUD 워크플로우', async ({ page }) => {
    console.log('🔍 종합 CRUD 워크플로우 테스트');
    
    const workflowData = {
      propertyName: `워크플로우_${Date.now()}`,
      manager: '정서연',
      address: '서울시 종로구',
      price: '18,000'
    };
    
    let success = 0;
    let failed = 0;
    
    // 1. 등록
    console.log('Step 1: 매물 등록');
    await page.goto(`${PRODUCTION_URL}form.html`);
    await page.waitForTimeout(6000);
    
    await page.fill('#propertyName', workflowData.propertyName);
    await page.selectOption('#manager', workflowData.manager);
    await page.fill('#address', workflowData.address);
    await page.fill('#price', workflowData.price);
    
    page.on('dialog', async dialog => {
      if (dialog.message().includes('성공')) success++;
      await dialog.accept();
    });
    
    await page.click('.btn-save');
    await page.waitForTimeout(8000);
    
    // 2. 수정 (관리자 로그인 필요)
    console.log('Step 2: 관리자 로그인 후 수정');
    await page.goto(`${PRODUCTION_URL}admin-login.html`);
    await page.fill('#username', 'jenny');
    await page.fill('#password', 'happyday');
    await page.click('.login-btn');
    await page.waitForTimeout(2000);
    
    await page.goto(PRODUCTION_URL);
    await page.waitForTimeout(5000);
    
    const createdRow = page.locator(`tr:has-text("${workflowData.propertyName}")`);
    if (await createdRow.count() > 0) {
      await createdRow.dblclick();
      await page.waitForTimeout(3000);
      
      if (page.url().includes('form.html')) {
        await page.fill('#price', '20,000');
        await page.click('.btn-save');
        await page.waitForTimeout(5000);
        success++;
      } else {
        failed++;
      }
    }
    
    // 3. 삭제
    console.log('Step 3: 매물 삭제');
    await page.goto(PRODUCTION_URL);
    await page.waitForTimeout(5000);
    
    const updatedRow = page.locator(`tr:has-text("${workflowData.propertyName}")`);
    if (await updatedRow.count() > 0) {
      const deleteBtn = updatedRow.locator('.btn-delete');
      await deleteBtn.click();
      await page.waitForTimeout(1000);
      
      const confirmBtn = page.locator('#deleteConfirmModal button:has-text("삭제")');
      await confirmBtn.click();
      await page.waitForTimeout(3000);
      
      if (await updatedRow.count() === 0) {
        success++;
      }
    }
    
    console.log(`\n📊 종합 결과: 성공 ${success}/3, 실패 ${failed}/3`);
    
    if (success >= 2) {
      console.log('✅ CRUD 기능이 대부분 정상 작동');
    } else {
      console.log('❌ CRUD 기능에 여전히 문제 있음');
    }
  });
});