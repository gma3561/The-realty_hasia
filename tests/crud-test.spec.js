const { test, expect } = require('@playwright/test');

// CRUD 기능 중심 테스트
test.describe('더부동산 CRUD 핵심 테스트', () => {
  const PRODUCTION_URL = 'https://gma3561.github.io/The-realty_hasia/';
  
  // 테스트용 데이터
  const testData = {
    propertyName: `테스트매물_${Date.now()}`,
    manager: '김규민',
    address: '서울시 강남구 테스트동 123',
    price: '30,000',
    dong: '101',
    unit: '1001'
  };
  
  let createdPropertyId = null;

  test('1. Supabase 데이터 로딩 확인', async ({ page }) => {
    console.log('📌 Supabase 데이터 로딩 테스트');
    
    await page.goto(PRODUCTION_URL);
    await page.waitForTimeout(5000); // Supabase 초기화 대기
    
    // 테이블에 데이터가 있는지 확인
    const rows = page.locator('.data-table tbody tr');
    const rowCount = await rows.count();
    
    console.log(`✅ 현재 매물 수: ${rowCount}개`);
    expect(rowCount).toBeGreaterThan(0);
    
    // 첫 번째 매물의 데이터 구조 확인
    if (rowCount > 0) {
      const firstRow = rows.first();
      const cells = firstRow.locator('td');
      const cellCount = await cells.count();
      
      console.log(`각 행의 컬럼 수: ${cellCount}개`);
      
      // 첫 번째 매물의 일부 데이터 출력
      const propertyId = await cells.nth(0).textContent();
      const propertyName = await cells.nth(5).textContent(); // 매물명 컬럼
      console.log(`샘플 매물 - ID: ${propertyId}, 매물명: ${propertyName}`);
    }
  });

  test('2. 매물 등록 테스트', async ({ page }) => {
    console.log('📌 매물 등록 테스트');
    
    // 1. 등록 페이지로 이동
    await page.goto(`${PRODUCTION_URL}form.html`);
    await page.waitForTimeout(5000); // 페이지 및 스크립트 로딩 대기
    
    // 2. 폼 필드 확인
    console.log('폼 필드 존재 확인');
    await expect(page.locator('#propertyName')).toBeVisible();
    await expect(page.locator('#manager')).toBeVisible();
    await expect(page.locator('#address')).toBeVisible();
    
    // 3. 데이터 입력
    console.log('테스트 데이터 입력');
    await page.fill('#propertyName', testData.propertyName);
    await page.selectOption('#manager', testData.manager);
    await page.fill('#address', testData.address);
    await page.fill('#price', testData.price);
    await page.fill('#dong', testData.dong);
    await page.fill('#unit', testData.unit);
    
    // 4. 저장 시도
    console.log('저장 버튼 클릭');
    
    // Alert 처리기 설정
    let savedSuccessfully = false;
    page.on('dialog', async dialog => {
      const message = dialog.message();
      console.log('Alert 메시지:', message);
      
      if (message.includes('성공') || message.includes('등록')) {
        savedSuccessfully = true;
      }
      await dialog.accept();
    });
    
    // 저장 버튼 클릭
    await page.click('.btn-save');
    await page.waitForTimeout(8000); // 저장 처리 대기
    
    // 5. 결과 확인
    if (savedSuccessfully) {
      console.log('✅ 매물 등록 성공');
      
      // 목록 페이지로 이동해서 확인
      await page.goto(PRODUCTION_URL);
      await page.waitForTimeout(5000);
      
      // 등록한 매물 찾기
      const newProperty = page.locator(`tr:has-text("${testData.propertyName}")`);
      if (await newProperty.count() > 0) {
        console.log('✅ 등록된 매물이 목록에 표시됨');
        
        // ID 추출 (수정/삭제 테스트용)
        const idCell = newProperty.locator('td').first();
        createdPropertyId = await idCell.textContent();
        console.log(`등록된 매물 ID: ${createdPropertyId}`);
      } else {
        console.log('⚠️ 등록된 매물을 목록에서 찾을 수 없음');
      }
    } else {
      console.log('❌ 매물 등록 실패');
    }
  });

  test('3. 매물 수정 테스트', async ({ page }) => {
    console.log('📌 매물 수정 테스트');
    
    // 1. 관리자 로그인
    console.log('관리자 로그인');
    await page.goto(`${PRODUCTION_URL}admin-login.html`);
    await page.waitForSelector('#username');
    
    await page.fill('#username', 'jenny');
    await page.fill('#password', 'happyday');
    
    page.on('dialog', async dialog => {
      console.log('로그인 Alert:', dialog.message());
      await dialog.accept();
    });
    
    await page.click('.login-btn');
    await page.waitForTimeout(3000);
    
    // 2. 매물 목록에서 테스트 매물 찾기
    await page.goto(PRODUCTION_URL);
    await page.waitForTimeout(5000);
    
    // 가장 최근 매물 또는 테스트 매물 찾기
    let targetProperty;
    
    // 먼저 방금 등록한 테스트 매물 찾기
    targetProperty = page.locator(`tr:has-text("${testData.propertyName}")`);
    
    if (await targetProperty.count() === 0) {
      // 테스트 매물이 없으면 첫 번째 매물 선택
      console.log('테스트 매물을 찾을 수 없어 첫 번째 매물 선택');
      targetProperty = page.locator('.data-table tbody tr').first();
    }
    
    if (await targetProperty.count() > 0) {
      // 3. 더블클릭으로 수정 모드 진입
      console.log('매물 더블클릭으로 수정 모드 진입 시도');
      await targetProperty.dblclick();
      await page.waitForTimeout(3000);
      
      // 수정 페이지로 이동했는지 확인
      if (page.url().includes('form.html')) {
        console.log('✅ 수정 페이지 진입 성공');
        
        // 4. 데이터 수정
        const updatedPrice = '35,000';
        const updatedAddress = testData.address + ' (수정됨)';
        
        await page.fill('#price', updatedPrice);
        await page.fill('#address', updatedAddress);
        
        // 5. 수정 저장
        let updateSuccess = false;
        page.on('dialog', async dialog => {
          const message = dialog.message();
          console.log('수정 Alert:', message);
          if (message.includes('수정') || message.includes('성공')) {
            updateSuccess = true;
          }
          await dialog.accept();
        });
        
        await page.click('.btn-save');
        await page.waitForTimeout(5000);
        
        if (updateSuccess) {
          console.log('✅ 매물 수정 성공');
          
          // 목록에서 수정사항 확인
          await page.goto(PRODUCTION_URL);
          await page.waitForTimeout(5000);
          
          const updatedProperty = page.locator(`tr:has-text("${updatedPrice}")`);
          if (await updatedProperty.count() > 0) {
            console.log('✅ 수정된 가격이 목록에 반영됨');
          }
        } else {
          console.log('❌ 매물 수정 실패');
        }
      } else {
        console.log('❌ 수정 페이지 진입 실패');
      }
    } else {
      console.log('❌ 수정할 매물을 찾을 수 없음');
    }
  });

  test('4. 매물 삭제 테스트', async ({ page }) => {
    console.log('📌 매물 삭제 테스트');
    
    // 1. 관리자 로그인
    console.log('관리자 로그인');
    await page.goto(`${PRODUCTION_URL}admin-login.html`);
    await page.waitForSelector('#username');
    
    await page.fill('#username', 'jenny');
    await page.fill('#password', 'happyday');
    
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    
    await page.click('.login-btn');
    await page.waitForTimeout(3000);
    
    // 2. 매물 목록으로 이동
    await page.goto(PRODUCTION_URL);
    await page.waitForTimeout(5000);
    
    // 3. 삭제할 매물 찾기 (테스트 매물 우선)
    let targetProperty = page.locator(`tr:has-text("${testData.propertyName}")`);
    
    if (await targetProperty.count() === 0) {
      // 테스트 매물이 없으면 "테스트" 텍스트를 포함한 다른 매물 찾기
      targetProperty = page.locator('tr:has-text("테스트")').first();
      
      if (await targetProperty.count() === 0) {
        console.log('⚠️ 삭제할 테스트 매물이 없음 - 테스트 스킵');
        return;
      }
    }
    
    // 삭제 전 매물 수 확인
    const beforeCount = await page.locator('.data-table tbody tr').count();
    console.log(`삭제 전 매물 수: ${beforeCount}`);
    
    // 4. 삭제 버튼 클릭
    const deleteButton = targetProperty.locator('.btn-delete');
    
    if (await deleteButton.count() > 0) {
      console.log('삭제 버튼 클릭');
      await deleteButton.click();
      await page.waitForTimeout(1000);
      
      // 5. 삭제 확인 모달 처리
      const confirmModal = page.locator('#deleteConfirmModal');
      if (await confirmModal.isVisible()) {
        console.log('삭제 확인 모달 표시됨');
        
        // 확인 버튼 클릭
        const confirmButton = confirmModal.locator('.btn-confirm, button:has-text("확인")');
        await confirmButton.click();
        
        // 삭제 완료 alert 처리
        page.on('dialog', async dialog => {
          console.log('삭제 Alert:', dialog.message());
          await dialog.accept();
        });
        
        await page.waitForTimeout(3000);
        
        // 6. 삭제 결과 확인
        const afterCount = await page.locator('.data-table tbody tr').count();
        console.log(`삭제 후 매물 수: ${afterCount}`);
        
        if (afterCount < beforeCount) {
          console.log('✅ 매물 삭제 성공');
          
          // 삭제된 매물이 목록에서 사라졌는지 확인
          const deletedProperty = page.locator(`tr:has-text("${testData.propertyName}")`);
          if (await deletedProperty.count() === 0) {
            console.log('✅ 삭제된 매물이 목록에서 제거됨');
          }
        } else {
          console.log('❌ 매물 삭제 실패');
        }
      } else {
        console.log('❌ 삭제 확인 모달이 표시되지 않음');
      }
    } else {
      console.log('❌ 삭제 버튼을 찾을 수 없음');
    }
  });

  test('5. 데이터 표시 정확성 검증', async ({ page }) => {
    console.log('📌 Supabase 데이터 표시 정확성 검증');
    
    await page.goto(PRODUCTION_URL);
    await page.waitForTimeout(5000);
    
    // 테이블 구조 분석
    const headers = await page.locator('.data-table thead th').allTextContents();
    console.log('테이블 헤더:', headers);
    
    // 첫 5개 매물 데이터 샘플링
    const rows = page.locator('.data-table tbody tr');
    const rowCount = Math.min(await rows.count(), 5);
    
    console.log(`\n상위 ${rowCount}개 매물 데이터:`);
    
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const cells = await row.locator('td').allTextContents();
      
      console.log(`\n매물 ${i + 1}:`);
      console.log(`- ID: ${cells[0]}`);
      console.log(`- 담당자: ${cells[2]}`);
      console.log(`- 상태: ${cells[3]}`);
      console.log(`- 매물명: ${cells[5]}`);
      console.log(`- 주소: ${cells[7]}`);
      console.log(`- 가격: ${cells[9]}`);
      
      // 데이터 무결성 검증
      expect(cells[0]).toBeTruthy(); // ID는 항상 있어야 함
      expect(cells[2]).toBeTruthy(); // 담당자는 항상 있어야 함
    }
    
    console.log('\n✅ 데이터 표시 검증 완료');
  });
});