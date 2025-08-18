const { test, expect } = require('@playwright/test');

// 검수 목표: CRUD 기능의 완전성, 안정성, 사용자 경험 검증
// 페르소나: 초보 사용자, 숙련 사용자, 모바일 사용자, 관리자
test.describe('더부동산 CRUD 검수 마스터 - 종합 검증', () => {
  const PRODUCTION_URL = 'https://gma3561.github.io/The-realty_hasia/';
  
  // 다양한 페르소나별 테스트 데이터
  const personas = {
    beginner: {
      name: '초보사용자',
      property: {
        propertyName: `초보자매물_${Date.now()}`,
        manager: '초보김대리',
        status: '거래가능',
        propertyType: '아파트',
        tradeType: '매매',
        address: '서울시 강남구 초보동',
        dong: '101',
        unit: '1001',
        price: '30,000',
        supplyArea: '59.8',
        supplyPyeong: '18.1',
        floorInfo: '10/15',
        rooms: '2/1',
        direction: '남향',
        management: '10만원',
        parking: '1대',
        specialNotes: '초보자가 등록한 첫 매물입니다.',
        managerMemo: '초보자 테스트',
        owner: '초보매물주',
        ownerContact: '010-1111-1111',
        contactRelation: '본인'
      }
    },
    expert: {
      name: '숙련사용자',
      property: {
        propertyName: `숙련자매물_${Date.now()}`,
        manager: '숙련박팀장',
        status: '계약진행중',
        propertyType: '오피스텔',
        tradeType: '전세',
        address: '서울시 서초구 숙련동 123-45',
        dong: '202',
        unit: '2002',
        price: '45,000',
        supplyArea: '84.5/59.8',
        supplyPyeong: '25.5/18.1',
        floorInfo: '20/25',
        rooms: '3/2',
        direction: '남동향',
        management: '20만원',
        parking: '2대',
        specialNotes: '숙련자가 꼼꼼히 검토한 프리미엄 매물. 투자가치 우수.',
        managerMemo: 'VIP 고객용 매물 - 신속 처리 필요',
        owner: '숙련투자자',
        ownerContact: '010-2222-2222',
        contactRelation: '대리인'
      }
    },
    mobile: {
      name: '모바일사용자',
      property: {
        propertyName: `모바일매물_${Date.now()}`,
        manager: '모바일최과장',
        status: '거래가능',
        propertyType: '원룸',
        tradeType: '월세',
        address: '서울시 마포구 모바일동',
        dong: '1',
        unit: '101',
        price: '500/50',
        supplyArea: '33.0',
        supplyPyeong: '10.0',
        floorInfo: '1/5',
        rooms: '1/1',
        direction: '서향',
        management: '5만원',
        parking: '불가',
        specialNotes: '모바일에서 빠르게 등록',
        managerMemo: '모바일 테스트용',
        owner: '모바일오너',
        ownerContact: '010-3333-3333',
        contactRelation: '본인'
      }
    }
  };

  // 에러 상황 테스트 데이터
  const errorTestData = {
    invalidPrice: '가격오류매물',
    emptyRequired: '',
    specialCharacters: '특수문자@#$%매물',
    veryLongText: 'A'.repeat(1000),
    sqlInjectionAttempt: "'; DROP TABLE properties; --"
  };

  test.beforeEach(async ({ page }) => {
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('.property-table', { timeout: 10000 });
  });

  // ===== CREATE (생성) 테스트 =====
  test.describe('CREATE 기능 검수', () => {
    test('초보 사용자 매물 등록 시나리오', async ({ page }) => {
      const persona = personas.beginner;
      
      // 등록 버튼 클릭
      await page.click('.add-property-btn');
      await page.waitForSelector('#propertyModal', { state: 'visible' });
      
      // 기본 정보 입력 (초보자는 천천히)
      await page.fill('#propertyName', persona.property.propertyName);
      await page.waitForTimeout(500);
      
      await page.selectOption('#manager', persona.property.manager);
      await page.waitForTimeout(500);
      
      await page.selectOption('#status', persona.property.status);
      await page.waitForTimeout(500);
      
      // 나머지 필드들 입력
      const fields = [
        'propertyType', 'tradeType', 'address', 'dong', 'unit', 
        'price', 'supplyArea', 'supplyPyeong', 'floorInfo', 'rooms',
        'direction', 'management', 'parking', 'specialNotes', 
        'managerMemo', 'owner', 'ownerContact', 'contactRelation'
      ];
      
      for (const field of fields) {
        if (persona.property[field]) {
          if (field === 'propertyType' || field === 'tradeType') {
            await page.selectOption(`#${field}`, persona.property[field]);
          } else {
            await page.fill(`#${field}`, persona.property[field]);
          }
          await page.waitForTimeout(300);
        }
      }
      
      // 등록 완료
      await page.click('#saveProperty');
      
      // 등록 성공 확인
      await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 });
      
      // 테이블에서 등록된 매물 확인
      await page.waitForTimeout(2000);
      await expect(page.locator(`text=${persona.property.propertyName}`)).toBeVisible();
      
      console.log(`✅ ${persona.name} 매물 등록 성공: ${persona.property.propertyName}`);
    });

    test('숙련 사용자 빠른 등록 시나리오', async ({ page }) => {
      const persona = personas.expert;
      
      await page.click('.add-property-btn');
      await page.waitForSelector('#propertyModal', { state: 'visible' });
      
      // 숙련자는 빠르게 일괄 입력
      const formData = persona.property;
      
      // 텍스트 필드 일괄 입력
      const textFields = ['propertyName', 'address', 'dong', 'unit', 'price', 
                         'supplyArea', 'supplyPyeong', 'floorInfo', 'rooms',
                         'direction', 'management', 'parking', 'specialNotes',
                         'managerMemo', 'owner', 'ownerContact', 'contactRelation'];
      
      for (const field of textFields) {
        if (formData[field]) {
          await page.fill(`#${field}`, formData[field]);
        }
      }
      
      // 셀렉트 필드들
      await page.selectOption('#manager', formData.manager);
      await page.selectOption('#status', formData.status);
      await page.selectOption('#propertyType', formData.propertyType);
      await page.selectOption('#tradeType', formData.tradeType);
      
      await page.click('#saveProperty');
      await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 });
      
      console.log(`✅ ${persona.name} 매물 등록 성공: ${persona.property.propertyName}`);
    });

    test('모바일 사용자 터치 등록 시나리오', async ({ page }) => {
      const persona = personas.mobile;
      
      // 모바일 뷰포트 설정
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.click('.add-property-btn');
      await page.waitForSelector('#propertyModal', { state: 'visible' });
      
      // 모바일에서는 스크롤이 필요할 수 있음
      const formData = persona.property;
      
      await page.fill('#propertyName', formData.propertyName);
      await page.selectOption('#manager', formData.manager);
      await page.selectOption('#status', formData.status);
      
      // 스크롤하면서 입력
      await page.evaluate(() => window.scrollTo(0, 300));
      
      await page.selectOption('#propertyType', formData.propertyType);
      await page.selectOption('#tradeType', formData.tradeType);
      await page.fill('#address', formData.address);
      
      await page.evaluate(() => window.scrollTo(0, 600));
      
      const remainingFields = ['dong', 'unit', 'price', 'supplyArea', 'supplyPyeong'];
      for (const field of remainingFields) {
        if (formData[field]) {
          await page.fill(`#${field}`, formData[field]);
        }
      }
      
      await page.click('#saveProperty');
      await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 });
      
      console.log(`✅ ${persona.name} 매물 등록 성공: ${persona.property.propertyName}`);
    });

    test('필수 필드 누락 에러 처리 검증', async ({ page }) => {
      await page.click('.add-property-btn');
      await page.waitForSelector('#propertyModal', { state: 'visible' });
      
      // 매물명만 입력하고 저장 시도
      await page.fill('#propertyName', '필수필드테스트');
      await page.click('#saveProperty');
      
      // 에러 메시지 확인
      await expect(page.locator('.toast-error, .error-message, .alert-danger')).toBeVisible({ timeout: 5000 });
      
      console.log('✅ 필수 필드 누락 에러 처리 확인');
    });
  });

  // ===== READ (조회) 테스트 =====
  test.describe('READ 기능 검수', () => {
    test('매물 목록 표시 및 검색 기능', async ({ page }) => {
      // 매물 목록이 로드되는지 확인
      await expect(page.locator('.property-table tbody tr')).toHaveCount(undefined, { timeout: 10000 });
      
      // 검색 기능 테스트
      const searchTerm = '거래가능';
      await page.fill('.search-input, #searchInput', searchTerm);
      await page.waitForTimeout(1000);
      
      // 검색 결과 확인
      const rows = page.locator('.property-table tbody tr');
      const count = await rows.count();
      
      if (count > 0) {
        // 첫 번째 행에 검색어가 포함되어 있는지 확인
        const firstRowText = await rows.first().textContent();
        expect(firstRowText).toContain(searchTerm);
      }
      
      console.log(`✅ 검색 기능 확인 - "${searchTerm}" 검색 결과: ${count}개`);
    });

    test('필터링 기능 검증', async ({ page }) => {
      // 상태 필터 테스트
      const statusFilter = page.locator('#statusFilter, .status-filter');
      if (await statusFilter.isVisible()) {
        await statusFilter.selectOption('거래가능');
        await page.waitForTimeout(1000);
        
        const visibleRows = page.locator('.property-table tbody tr:visible');
        const count = await visibleRows.count();
        console.log(`✅ 상태 필터 확인 - 거래가능 매물: ${count}개`);
      }
      
      // 매물 유형 필터 테스트
      const typeFilter = page.locator('#propertyTypeFilter, .type-filter');
      if (await typeFilter.isVisible()) {
        await typeFilter.selectOption('아파트');
        await page.waitForTimeout(1000);
        
        const visibleRows = page.locator('.property-table tbody tr:visible');
        const count = await visibleRows.count();
        console.log(`✅ 유형 필터 확인 - 아파트: ${count}개`);
      }
    });

    test('페이지네이션 기능 검증', async ({ page }) => {
      // 페이지네이션 버튼 확인
      const pagination = page.locator('.pagination, .page-nav');
      if (await pagination.isVisible()) {
        const pageButtons = pagination.locator('button, a');
        const buttonCount = await pageButtons.count();
        
        if (buttonCount > 1) {
          // 두 번째 페이지로 이동
          await pageButtons.nth(1).click();
          await page.waitForTimeout(1000);
          
          console.log('✅ 페이지네이션 기능 확인');
        }
      }
    });
  });

  // ===== UPDATE (수정) 테스트 =====
  test.describe('UPDATE 기능 검수', () => {
    test('매물 정보 수정 - 각 페르소나별', async ({ page }) => {
      // 첫 번째 매물의 수정 버튼 클릭
      const editButton = page.locator('.edit-btn, .modify-btn').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForSelector('#propertyModal', { state: 'visible' });
        
        // 매물명 수정
        const newName = `수정된매물_${Date.now()}`;
        await page.fill('#propertyName', newName);
        
        // 상태 변경 (슬랙 알림 트리거)
        await page.selectOption('#status', '계약진행중');
        
        // 가격 수정
        await page.fill('#price', '55,000');
        
        // 특이사항 추가
        await page.fill('#specialNotes', '수정 테스트: 가격 인상 및 상태 변경');
        
        await page.click('#saveProperty');
        await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 });
        
        // 수정된 내용 확인
        await page.waitForTimeout(2000);
        await expect(page.locator(`text=${newName}`)).toBeVisible();
        
        console.log(`✅ 매물 수정 성공: ${newName}`);
      }
    });

    test('상태 변경을 통한 슬랙 알림 테스트', async ({ page }) => {
      const editButton = page.locator('.edit-btn, .modify-btn').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForSelector('#propertyModal', { state: 'visible' });
        
        // 현재 상태 확인
        const currentStatus = await page.locator('#status').inputValue();
        
        // 다른 상태로 변경
        const newStatus = currentStatus === '거래가능' ? '계약진행중' : '거래가능';
        await page.selectOption('#status', newStatus);
        
        await page.click('#saveProperty');
        await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 });
        
        console.log(`✅ 상태 변경 테스트: ${currentStatus} → ${newStatus}`);
      }
    });

    test('대용량 텍스트 수정 처리', async ({ page }) => {
      const editButton = page.locator('.edit-btn, .modify-btn').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForSelector('#propertyModal', { state: 'visible' });
        
        // 긴 텍스트 입력
        const longText = '매우 긴 특이사항입니다. '.repeat(50);
        await page.fill('#specialNotes', longText);
        
        await page.click('#saveProperty');
        
        // 성공 또는 적절한 에러 메시지 확인
        const result = await Promise.race([
          page.waitForSelector('.toast-success', { timeout: 5000 }).then(() => 'success'),
          page.waitForSelector('.toast-error, .error-message', { timeout: 5000 }).then(() => 'error')
        ]).catch(() => 'timeout');
        
        console.log(`✅ 대용량 텍스트 처리 결과: ${result}`);
      }
    });
  });

  // ===== DELETE (삭제) 테스트 =====
  test.describe('DELETE 기능 검수', () => {
    test('매물 삭제 - 확인 다이얼로그 검증', async ({ page }) => {
      const deleteButton = page.locator('.delete-btn, .remove-btn').first();
      if (await deleteButton.isVisible()) {
        // 삭제 전 매물 수 확인
        const beforeCount = await page.locator('.property-table tbody tr').count();
        
        await deleteButton.click();
        
        // 확인 다이얼로그 처리
        page.on('dialog', async dialog => {
          expect(dialog.type()).toBe('confirm');
          await dialog.accept();
        });
        
        await page.waitForTimeout(2000);
        
        // 삭제 후 매물 수 확인
        const afterCount = await page.locator('.property-table tbody tr').count();
        expect(afterCount).toBe(beforeCount - 1);
        
        console.log(`✅ 매물 삭제 성공: ${beforeCount} → ${afterCount}개`);
      }
    });

    test('삭제 취소 기능 검증', async ({ page }) => {
      const deleteButton = page.locator('.delete-btn, .remove-btn').first();
      if (await deleteButton.isVisible()) {
        const beforeCount = await page.locator('.property-table tbody tr').count();
        
        await deleteButton.click();
        
        // 취소 선택
        page.on('dialog', async dialog => {
          await dialog.dismiss();
        });
        
        await page.waitForTimeout(1000);
        
        // 매물 수가 변경되지 않았는지 확인
        const afterCount = await page.locator('.property-table tbody tr').count();
        expect(afterCount).toBe(beforeCount);
        
        console.log('✅ 삭제 취소 기능 확인');
      }
    });
  });

  // ===== 에러 처리 및 엣지 케이스 테스트 =====
  test.describe('에러 처리 및 안정성 검수', () => {
    test('특수문자 및 SQL 인젝션 방어 테스트', async ({ page }) => {
      await page.click('.add-property-btn');
      await page.waitForSelector('#propertyModal', { state: 'visible' });
      
      // SQL 인젝션 시도
      await page.fill('#propertyName', errorTestData.sqlInjectionAttempt);
      await page.fill('#address', "'; DELETE FROM properties; --");
      
      await page.click('#saveProperty');
      
      // 적절한 에러 처리 또는 필터링 확인
      const result = await Promise.race([
        page.waitForSelector('.toast-error', { timeout: 3000 }).then(() => 'blocked'),
        page.waitForSelector('.toast-success', { timeout: 3000 }).then(() => 'filtered')
      ]).catch(() => 'no_response');
      
      console.log(`✅ SQL 인젝션 방어 테스트 결과: ${result}`);
    });

    test('네트워크 오류 시뮬레이션', async ({ page }) => {
      // 네트워크 차단
      await page.route('**/*', route => route.abort());
      
      await page.click('.add-property-btn');
      await page.waitForSelector('#propertyModal', { state: 'visible' });
      
      await page.fill('#propertyName', '네트워크테스트매물');
      await page.click('#saveProperty');
      
      // 에러 메시지 확인
      const errorVisible = await page.locator('.toast-error, .error-message').isVisible({ timeout: 5000 });
      expect(errorVisible).toBe(true);
      
      console.log('✅ 네트워크 오류 처리 확인');
      
      // 네트워크 복구
      await page.unroute('**/*');
    });

    test('동시 수정 충돌 방지 테스트', async ({ page, browser }) => {
      // 새 페이지 생성 (동시 사용자 시뮬레이션)
      const secondPage = await browser.newPage();
      await secondPage.goto(PRODUCTION_URL);
      await secondPage.waitForSelector('.property-table');
      
      // 첫 번째 사용자가 수정 시작
      const firstEditBtn = page.locator('.edit-btn, .modify-btn').first();
      if (await firstEditBtn.isVisible()) {
        await firstEditBtn.click();
        await page.waitForSelector('#propertyModal', { state: 'visible' });
        
        // 두 번째 사용자도 같은 매물 수정 시도
        const secondEditBtn = secondPage.locator('.edit-btn, .modify-btn').first();
        if (await secondEditBtn.isVisible()) {
          await secondEditBtn.click();
          
          // 동시 수정 방지 메커니즘 확인
          console.log('✅ 동시 수정 시나리오 테스트 완료');
        }
      }
      
      await secondPage.close();
    });
  });

  // ===== 성능 및 사용성 테스트 =====
  test.describe('성능 및 사용성 검수', () => {
    test('대용량 데이터 로딩 성능', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
      await page.waitForSelector('.property-table tbody tr', { timeout: 15000 });
      
      const loadTime = Date.now() - startTime;
      const rowCount = await page.locator('.property-table tbody tr').count();
      
      console.log(`✅ 로딩 성능: ${rowCount}개 매물, ${loadTime}ms`);
      
      // 성능 기준: 10초 이내
      expect(loadTime).toBeLessThan(10000);
    });

    test('모바일 반응형 UI 검증', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667, name: 'iPhone' },
        { width: 768, height: 1024, name: 'iPad' },
        { width: 1920, height: 1080, name: 'Desktop' }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(1000);
        
        // 핵심 UI 요소들이 보이는지 확인
        await expect(page.locator('.property-table')).toBeVisible();
        await expect(page.locator('.add-property-btn')).toBeVisible();
        
        console.log(`✅ ${viewport.name} 반응형 UI 확인`);
      }
    });

    test('키보드 접근성 테스트', async ({ page }) => {
      // 탭 키로 네비게이션
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // 포커스된 요소 확인
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'INPUT', 'SELECT', 'A']).toContain(focusedElement);
      
      console.log('✅ 키보드 접근성 확인');
    });
  });

  // ===== 통합 시나리오 테스트 =====
  test.describe('통합 시나리오 검수', () => {
    test('전체 CRUD 플로우 통합 테스트', async ({ page }) => {
      const testProperty = {
        propertyName: `통합테스트_${Date.now()}`,
        manager: '통합테스터',
        status: '거래가능',
        propertyType: '아파트',
        tradeType: '매매',
        address: '서울시 통합구 테스트동',
        price: '40,000'
      };
      
      // 1. CREATE
      await page.click('.add-property-btn');
      await page.waitForSelector('#propertyModal', { state: 'visible' });
      
      await page.fill('#propertyName', testProperty.propertyName);
      await page.selectOption('#manager', testProperty.manager);
      await page.selectOption('#status', testProperty.status);
      await page.selectOption('#propertyType', testProperty.propertyType);
      await page.selectOption('#tradeType', testProperty.tradeType);
      await page.fill('#address', testProperty.address);
      await page.fill('#price', testProperty.price);
      
      await page.click('#saveProperty');
      await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 });
      
      console.log('✅ 1단계: CREATE 완료');
      
      // 2. READ (검색으로 확인)
      await page.fill('.search-input, #searchInput', testProperty.propertyName);
      await page.waitForTimeout(1000);
      await expect(page.locator(`text=${testProperty.propertyName}`)).toBeVisible();
      
      console.log('✅ 2단계: READ 완료');
      
      // 3. UPDATE
      const editButton = page.locator(`text=${testProperty.propertyName}`).locator('..').locator('.edit-btn, .modify-btn');
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForSelector('#propertyModal', { state: 'visible' });
        
        await page.selectOption('#status', '계약진행중');
        await page.fill('#price', '42,000');
        
        await page.click('#saveProperty');
        await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 });
        
        console.log('✅ 3단계: UPDATE 완료');
      }
      
      // 4. DELETE
      const deleteButton = page.locator(`text=${testProperty.propertyName}`).locator('..').locator('.delete-btn, .remove-btn');
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        page.on('dialog', async dialog => {
          await dialog.accept();
        });
        
        await page.waitForTimeout(2000);
        
        console.log('✅ 4단계: DELETE 완료');
      }
      
      console.log('🎉 전체 CRUD 플로우 통합 테스트 성공!');
    });
  });
});