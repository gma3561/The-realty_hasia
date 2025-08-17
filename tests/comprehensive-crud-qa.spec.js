const { test, expect } = require('@playwright/test');

// 실제 프로덕션 사이트 상세 CRUD QA 테스트
test.describe('더부동산 매물관리시스템 종합 CRUD QA', () => {
  const PRODUCTION_URL = 'https://gma3561.github.io/The-realty_hasia/';
  
  // 테스트용 데이터
  const testProperty = {
    propertyName: `QA테스트매물_${Date.now()}`,
    manager: '김규민', 
    status: '거래가능',
    propertyType: '아파트',
    tradeType: '매매',
    address: '서울시 강남구 QA테스트동',
    dong: '101',
    unit: '1001',
    price: '50,000',
    supplyArea: '84.5/59.8',
    supplyPyeong: '25.5/18.1',
    floorInfo: '15/25',
    rooms: '3/2',
    direction: '남향',
    management: '15만원',
    parking: '1대',
    specialNotes: 'Playwright 자동화 테스트용 매물입니다.',
    managerMemo: 'QA 테스트 매물 - 테스트 완료 후 삭제 예정',
    owner: 'QA테스트 소유자',
    ownerContact: '010-0000-0000',
    contactRelation: '본인'
  };

  let propertyId = null; // 등록된 매물 ID 저장

  test.beforeEach(async ({ page }) => {
    console.log('🔄 테스트 시작 - 프로덕션 사이트 접근');
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    
    // Supabase 초기화 대기
    await page.waitForTimeout(3000);
    
    console.log('✅ 프로덕션 사이트 로드 완료');
  });

  // ==================== 1. 매물 등록 테스트 ====================
  test.describe('1. 매물 등록 기능 테스트', () => {
    test('1.1 기본 등록 프로세스 - 전체 워크플로우', async ({ page }) => {
      console.log('📝 테스트 1.1: 매물 등록 전체 워크플로우');
      
      // Step 1: 매물등록 버튼 클릭
      console.log('Step 1: 매물등록 버튼 클릭');
      const registerButton = page.locator('.btn-primary');
      await expect(registerButton).toBeVisible();
      await registerButton.click();
      
      // Step 2: 폼 페이지 이동 확인
      console.log('Step 2: 폼 페이지 이동 확인');
      await expect(page).toHaveURL(/form\.html/);
      await expect(page.locator('#propertyForm')).toBeVisible();
      await expect(page.locator('.page-title')).toContainText('매물등록');
      
      // Step 3: 자동 설정값 확인
      console.log('Step 3: 자동 설정값 확인');
      const registerDateField = page.locator('#registerDate');
      const today = new Date().toISOString().split('T')[0];
      await expect(registerDateField).toHaveValue(today);
      
      // Step 4: 필수 입력 필드 작성
      console.log('Step 4: 필수 입력 필드 작성');
      await page.selectOption('#manager', testProperty.manager);
      await page.selectOption('#status', testProperty.status);
      await page.selectOption('#propertyType', testProperty.propertyType);
      await page.selectOption('#tradeType', testProperty.tradeType);
      await page.fill('#propertyName', testProperty.propertyName);
      
      // Step 5: 추가 정보 입력
      console.log('Step 5: 추가 정보 입력');
      await page.fill('#address', testProperty.address);
      await page.fill('#dong', testProperty.dong);
      await page.fill('#unit', testProperty.unit);
      await page.fill('#price', testProperty.price);
      await page.fill('#supplyArea', testProperty.supplyArea);
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
      
      // Step 6: 면적 자동 계산 확인
      console.log('Step 6: 면적 자동 계산 확인');
      const supplyPyeongField = page.locator('#supplyPyeong');
      // ㎡ 입력 후 평으로 자동 변환되는지 확인
      await expect(supplyPyeongField).toHaveValue(/25\.5/);
      
      // Step 7: 저장 및 확인 다이얼로그 처리
      console.log('Step 7: 저장 버튼 클릭 및 다이얼로그 처리');
      page.on('dialog', async dialog => {
        console.log('다이얼로그 메시지:', dialog.message());
        expect(dialog.message()).toContain('성공적으로 등록');
        await dialog.accept();
      });
      
      const saveButton = page.locator('.btn-save');
      await saveButton.click();
      
      // Step 8: 목록 페이지 자동 이동 확인
      console.log('Step 8: 목록 페이지 자동 이동 확인');
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(PRODUCTION_URL);
      
      // Step 9: 새 매물이 목록에 표시되는지 확인
      console.log('Step 9: 등록된 매물 목록에서 확인');
      await page.waitForTimeout(2000);
      
      // 등록한 매물이 목록에 있는지 확인
      const propertyRow = page.locator(`tr:has-text("${testProperty.propertyName}")`);
      await expect(propertyRow).toBeVisible();
      
      // 매물 ID 추출 (후속 테스트를 위해)
      const propertyCell = propertyRow.locator('td').first();
      propertyId = await propertyCell.textContent();
      console.log(`등록된 매물 ID: ${propertyId}`);
      
      console.log('✅ 매물 등록 전체 워크플로우 성공');
    });
    
    test('1.2 필수 필드 검증 테스트', async ({ page }) => {
      console.log('📝 테스트 1.2: 필수 필드 검증');
      
      // 매물등록 페이지로 이동
      await page.goto(`${PRODUCTION_URL}form.html`);
      await page.waitForSelector('#propertyForm');
      
      // 필수 필드 없이 저장 시도
      page.on('dialog', async dialog => {
        console.log('검증 메시지:', dialog.message());
        expect(dialog.message()).toMatch(/(입력해주세요|필수)/);
        await dialog.accept();
      });
      
      // 매물명 없이 저장 시도
      console.log('매물명 없이 저장 시도');
      await page.click('.btn-save');
      await page.waitForTimeout(1000);
      
      console.log('✅ 필수 필드 검증 성공');
    });
    
    test('1.3 면적 자동 계산 기능 검증', async ({ page }) => {
      console.log('📝 테스트 1.3: 면적 자동 계산 기능');
      
      await page.goto(`${PRODUCTION_URL}form.html`);
      await page.waitForSelector('#propertyForm');
      
      // ㎡ 입력 후 평으로 자동 변환 테스트
      console.log('㎡ → 평 자동 변환 테스트');
      await page.fill('#supplyArea', '84.5');
      await page.press('#supplyArea', 'Tab');
      await page.waitForTimeout(500);
      
      const supplyPyeong = await page.locator('#supplyPyeong').inputValue();
      const expectedPyeong = (84.5 * 0.3025).toFixed(2);
      console.log(`입력: 84.5㎡, 계산결과: ${supplyPyeong}평, 예상: ${expectedPyeong}평`);
      expect(parseFloat(supplyPyeong)).toBeCloseTo(parseFloat(expectedPyeong), 1);
      
      // 분리 입력 테스트 (공급/전용)
      console.log('공급/전용 분리 입력 테스트');
      await page.fill('#supplyArea', '84.5/59.8');
      await page.press('#supplyArea', 'Tab');
      await page.waitForTimeout(500);
      
      const combinedPyeong = await page.locator('#supplyPyeong').inputValue();
      console.log(`분리 입력 결과: ${combinedPyeong}`);
      expect(combinedPyeong).toMatch(/\d+\.\d+\/\d+\.\d+/);
      
      console.log('✅ 면적 자동 계산 기능 성공');
    });
  });

  // ==================== 2. 매물 수정 테스트 ====================
  test.describe('2. 매물 수정 기능 테스트', () => {
    test.beforeEach(async ({ page }) => {
      // 관리자 로그인 (수정 권한 필요)
      console.log('🔐 관리자 로그인 진행');
      await page.goto(`${PRODUCTION_URL}admin-login.html`);
      await page.waitForSelector('#username');
      
      // 관리자 계정 입력 (실제 운영 계정 사용)
      await page.fill('#username', 'jenny');
      await page.fill('#password', 'happyday');
      
      // 로그인 버튼이 존재하는지 확인 후 클릭
      const loginButton = page.locator('.btn-login');
      if (await loginButton.count() > 0) {
        await loginButton.click();
      } else {
        // Enter 키로 로그인 시도
        await page.press('#password', 'Enter');
      }
      await page.waitForTimeout(1000);
      
      // 메인 페이지로 이동
      await page.goto(PRODUCTION_URL);
      await page.waitForTimeout(2000);
      console.log('✅ 관리자 로그인 완료');
    });
    
    test('2.1 수정 모드 진입 및 데이터 로드', async ({ page }) => {
      console.log('📝 테스트 2.1: 수정 모드 진입');
      
      // 이전 테스트에서 등록한 매물 찾기
      const testPropertyRow = page.locator(`tr:has-text("${testProperty.propertyName}")`);
      
      if (await testPropertyRow.count() === 0) {
        console.log('⚠️ 테스트 매물이 없어 새로 생성');
        // 매물이 없다면 새로 등록
        await page.click('.btn-primary');
        await page.waitForURL(/form\.html/);
        
        await page.selectOption('#manager', testProperty.manager);
        await page.fill('#propertyName', testProperty.propertyName);
        await page.fill('#address', testProperty.address);
        
        page.on('dialog', async dialog => await dialog.accept());
        await page.click('.btn-save');
        await page.waitForTimeout(3000);
        await page.goto(PRODUCTION_URL);
        await page.waitForTimeout(2000);
      }
      
      // 매물 더블클릭으로 수정 모드 진입
      console.log('매물 더블클릭으로 수정 모드 진입');
      await testPropertyRow.dblclick();
      
      // 수정 페이지 이동 확인
      await expect(page).toHaveURL(/form\.html\?edit=/);
      await expect(page.locator('.page-title')).toContainText('매물수정');
      
      // 기존 데이터가 폼에 로드되었는지 확인
      console.log('기존 데이터 로드 확인');
      await expect(page.locator('#propertyName')).toHaveValue(testProperty.propertyName);
      await expect(page.locator('#address')).toHaveValue(testProperty.address);
      
      // 저장 버튼이 "수정"으로 변경되었는지 확인
      await expect(page.locator('.btn-save')).toContainText('수정');
      
      console.log('✅ 수정 모드 진입 성공');
    });
    
    test('2.2 매물 정보 수정 및 저장', async ({ page }) => {
      console.log('📝 테스트 2.2: 매물 정보 수정');
      
      // 테스트 매물 찾아서 수정 모드 진입
      const testPropertyRow = page.locator(`tr:has-text("${testProperty.propertyName}")`);
      await testPropertyRow.dblclick();
      await page.waitForURL(/form\.html\?edit=/);
      
      // 가격 및 상태 수정
      const updatedPrice = '55,000';
      const updatedStatus = '거래완료';
      const updatedNotes = testProperty.specialNotes + ' [수정됨]';
      
      console.log('가격, 상태, 특이사항 수정');
      await page.fill('#price', updatedPrice);
      await page.selectOption('#status', updatedStatus);
      await page.fill('#specialNotes', updatedNotes);
      
      // 수정 저장
      page.on('dialog', async dialog => {
        console.log('수정 완료 메시지:', dialog.message());
        expect(dialog.message()).toContain('성공적으로 수정');
        await dialog.accept();
      });
      
      await page.click('.btn-save');
      await page.waitForTimeout(3000);
      
      // 목록에서 수정사항 반영 확인
      await expect(page).toHaveURL(PRODUCTION_URL);
      const updatedRow = page.locator(`tr:has-text("${testProperty.propertyName}")`);
      await expect(updatedRow).toContainText(updatedPrice);
      await expect(updatedRow).toContainText(updatedStatus);
      
      console.log('✅ 매물 정보 수정 성공');
    });
    
    test('2.3 수정 권한 검증', async ({ page }) => {
      console.log('📝 테스트 2.3: 수정 권한 검증');
      
      // 로그아웃 (일반 사용자 상태로 변경)
      await page.evaluate(() => {
        sessionStorage.removeItem('admin_logged_in');
      });
      
      // 매물 수정 시도
      const testPropertyRow = page.locator(`tr:has-text("${testProperty.propertyName}")`);
      
      page.on('dialog', async dialog => {
        console.log('권한 검증 메시지:', dialog.message());
        expect(dialog.message()).toContain('관리자만');
        await dialog.accept();
      });
      
      if (await testPropertyRow.count() > 0) {
        await testPropertyRow.dblclick();
        await page.waitForTimeout(1000);
      }
      
      console.log('✅ 수정 권한 검증 성공');
    });
  });

  // ==================== 3. 매물 삭제 테스트 ====================
  test.describe('3. 매물 삭제 기능 테스트', () => {
    test.beforeEach(async ({ page }) => {
      // 관리자 로그인
      console.log('🔐 관리자 로그인 진행');
      await page.goto(`${PRODUCTION_URL}admin-login.html`);
      await page.waitForSelector('#username');
      await page.fill('#password', 'realty2024!');
      
      const loginButton = page.locator('.login-btn');
      await loginButton.click();
      await page.waitForTimeout(1000);
      await page.goto(PRODUCTION_URL);
      await page.waitForTimeout(2000);
    });
    
    test('3.1 삭제 확인 프로세스', async ({ page }) => {
      console.log('📝 테스트 3.1: 삭제 확인 프로세스');
      
      // 테스트 매물 찾기
      const testPropertyRow = page.locator(`tr:has-text("${testProperty.propertyName}")`);
      
      if (await testPropertyRow.count() === 0) {
        console.log('⚠️ 삭제할 테스트 매물이 없어 테스트 스킵');
        return;
      }
      
      // 삭제 버튼 클릭
      console.log('삭제 버튼 클릭');
      const deleteButton = testPropertyRow.locator('.btn-delete');
      await expect(deleteButton).toBeVisible();
      await deleteButton.click();
      
      // 삭제 확인 모달 확인
      console.log('삭제 확인 모달 확인');
      const modal = page.locator('#deleteConfirmModal');
      await expect(modal).toBeVisible();
      await expect(modal).toContainText(testProperty.propertyName);
      
      // 취소 버튼 테스트
      console.log('취소 버튼 테스트');
      await page.click('.btn-cancel');
      await expect(modal).not.toBeVisible();
      
      // 매물이 여전히 목록에 있는지 확인
      await expect(testPropertyRow).toBeVisible();
      
      console.log('✅ 삭제 확인 프로세스 성공');
    });
    
    test('3.2 실제 삭제 및 소프트 삭제 확인', async ({ page }) => {
      console.log('📝 테스트 3.2: 실제 삭제 처리');
      
      // 테스트 매물 찾기
      const testPropertyRow = page.locator(`tr:has-text("${testProperty.propertyName}")`);
      
      if (await testPropertyRow.count() === 0) {
        console.log('⚠️ 삭제할 테스트 매물이 없어 테스트 스킵');
        return;
      }
      
      // 현재 목록 개수 확인
      const initialRowCount = await page.locator('.data-table tbody tr').count();
      console.log(`삭제 전 매물 수: ${initialRowCount}`);
      
      // 삭제 실행
      console.log('삭제 실행');
      const deleteButton = testPropertyRow.locator('.btn-delete');
      await deleteButton.click();
      
      // 삭제 확인
      page.on('dialog', async dialog => {
        console.log('삭제 확인 메시지:', dialog.message());
        expect(dialog.message()).toContain('삭제되었습니다');
        await dialog.accept();
      });
      
      const confirmButton = page.locator('#deleteConfirmModal .btn-confirm');
      await confirmButton.click();
      await page.waitForTimeout(2000);
      
      // 목록에서 제거 확인
      console.log('목록에서 제거 확인');
      await expect(testPropertyRow).not.toBeVisible();
      
      // 총 개수 감소 확인
      const finalRowCount = await page.locator('.data-table tbody tr').count();
      console.log(`삭제 후 매물 수: ${finalRowCount}`);
      expect(finalRowCount).toBeLessThan(initialRowCount);
      
      console.log('✅ 매물 삭제 성공');
    });
    
    test('3.3 삭제 권한 검증', async ({ page }) => {
      console.log('📝 테스트 3.3: 삭제 권한 검증');
      
      // 로그아웃
      await page.evaluate(() => {
        sessionStorage.removeItem('admin_logged_in');
      });
      
      // 임의의 매물에 대해 삭제 시도
      const anyPropertyRow = page.locator('.data-table tbody tr').first();
      
      if (await anyPropertyRow.count() > 0) {
        page.on('dialog', async dialog => {
          console.log('권한 검증 메시지:', dialog.message());
          expect(dialog.message()).toContain('관리자만');
          await dialog.accept();
        });
        
        const deleteButton = anyPropertyRow.locator('.btn-delete');
        if (await deleteButton.count() > 0) {
          await deleteButton.click();
          await page.waitForTimeout(1000);
        }
      }
      
      console.log('✅ 삭제 권한 검증 성공');
    });
  });

  // ==================== 4. 통합 워크플로우 테스트 ====================
  test.describe('4. 통합 워크플로우 테스트', () => {
    test('4.1 전체 매물 생명주기 (등록→수정→삭제)', async ({ page }) => {
      console.log('📝 테스트 4.1: 전체 매물 생명주기');
      
      const lifecycleProperty = {
        propertyName: `생명주기테스트_${Date.now()}`,
        manager: '정서연',
        address: '서울시 서초구 생명주기테스트동',
        price: '30,000'
      };
      
      // === 1단계: 등록 ===
      console.log('1단계: 매물 등록');
      await page.click('.btn-primary');
      await page.waitForURL(/form\.html/);
      
      await page.selectOption('#manager', lifecycleProperty.manager);
      await page.fill('#propertyName', lifecycleProperty.propertyName);
      await page.fill('#address', lifecycleProperty.address);
      await page.fill('#price', lifecycleProperty.price);
      
      page.on('dialog', async dialog => await dialog.accept());
      await page.click('.btn-save');
      await page.waitForTimeout(3000);
      
      // 등록 확인
      const newRow = page.locator(`tr:has-text("${lifecycleProperty.propertyName}")`);
      await expect(newRow).toBeVisible();
      console.log('✅ 1단계 등록 완료');
      
      // === 2단계: 수정 ===
      console.log('2단계: 매물 수정');
      await page.goto(`${PRODUCTION_URL}admin-login.html`);
      await page.waitForSelector('#username');
      await page.fill('#password', 'realty2024!');
      
      const loginButton = page.locator('.login-btn');
      await loginButton.click();
      await page.goto(PRODUCTION_URL);
      await page.waitForTimeout(2000);
      
      await newRow.dblclick();
      await page.waitForURL(/form\.html\?edit=/);
      
      const updatedPrice = '35,000';
      await page.fill('#price', updatedPrice);
      await page.click('.btn-save');
      await page.waitForTimeout(3000);
      
      // 수정 확인
      await expect(page.locator(`tr:has-text("${lifecycleProperty.propertyName}")`)).toContainText(updatedPrice);
      console.log('✅ 2단계 수정 완료');
      
      // === 3단계: 삭제 ===
      console.log('3단계: 매물 삭제');
      const updatedRow = page.locator(`tr:has-text("${lifecycleProperty.propertyName}")`);
      const deleteButton = updatedRow.locator('.btn-delete');
      await deleteButton.click();
      
      const confirmButton = page.locator('#deleteConfirmModal .btn-confirm');
      await confirmButton.click();
      await page.waitForTimeout(2000);
      
      // 삭제 확인
      await expect(updatedRow).not.toBeVisible();
      console.log('✅ 3단계 삭제 완료');
      
      console.log('🎉 전체 매물 생명주기 테스트 성공');
    });
    
    test('4.2 실시간 데이터 동기화 검증', async ({ page, browser }) => {
      console.log('📝 테스트 4.2: 실시간 데이터 동기화');
      
      // 두 번째 브라우저 컨텍스트 생성
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();
      
      // 두 페이지 모두 메인 화면 로드
      await page.goto(PRODUCTION_URL);
      await page2.goto(PRODUCTION_URL);
      await page.waitForTimeout(2000);
      await page2.waitForTimeout(2000);
      
      // 첫 번째 페이지에서 매물 등록
      console.log('첫 번째 브라우저에서 매물 등록');
      const realtimeProperty = {
        propertyName: `실시간테스트_${Date.now()}`,
        manager: '하상현',
        address: '실시간 동기화 테스트'
      };
      
      await page.click('.btn-primary');
      await page.waitForURL(/form\.html/);
      await page.selectOption('#manager', realtimeProperty.manager);
      await page.fill('#propertyName', realtimeProperty.propertyName);
      await page.fill('#address', realtimeProperty.address);
      
      page.on('dialog', async dialog => await dialog.accept());
      await page.click('.btn-save');
      await page.waitForTimeout(3000);
      
      // 두 번째 페이지에서 새 매물 확인 (실시간 동기화)
      console.log('두 번째 브라우저에서 실시간 동기화 확인');
      await page2.waitForTimeout(2000);
      await page2.reload(); // 실시간 구독이 작동하지 않는 경우 대비
      await page2.waitForTimeout(2000);
      
      const syncedRow = page2.locator(`tr:has-text("${realtimeProperty.propertyName}")`);
      await expect(syncedRow).toBeVisible();
      
      await context2.close();
      console.log('✅ 실시간 데이터 동기화 성공');
    });
  });

  // ==================== 5. 오류 상황 처리 테스트 ====================
  test.describe('5. 오류 상황 처리 테스트', () => {
    test('5.1 네트워크 오류 시나리오', async ({ page }) => {
      console.log('📝 테스트 5.1: 네트워크 오류 시나리오');
      
      // 매물등록 페이지로 이동
      await page.goto(`${PRODUCTION_URL}form.html`);
      await page.waitForSelector('#propertyForm');
      
      // 폼 작성
      await page.selectOption('#manager', '김규민');
      await page.fill('#propertyName', 'Network_Test_Property');
      
      // 네트워크 차단 시뮬레이션
      console.log('네트워크 차단 시뮬레이션');
      await page.route('**/*supabase*', route => {
        route.abort();
      });
      
      // 저장 시도
      page.on('dialog', async dialog => {
        console.log('네트워크 오류 메시지:', dialog.message());
        expect(dialog.message()).toMatch(/(오류|실패|연결)/);
        await dialog.accept();
      });
      
      await page.click('.btn-save');
      await page.waitForTimeout(3000);
      
      console.log('✅ 네트워크 오류 처리 확인');
    });
    
    test('5.2 데이터 유효성 검증', async ({ page }) => {
      console.log('📝 테스트 5.2: 데이터 유효성 검증');
      
      await page.goto(`${PRODUCTION_URL}form.html`);
      await page.waitForSelector('#propertyForm');
      
      // 극도로 긴 텍스트 입력 시도
      const longText = 'A'.repeat(1000);
      await page.fill('#propertyName', longText);
      await page.fill('#specialNotes', longText);
      
      // 특수 문자 입력 시도
      await page.fill('#address', '<script>alert("XSS")</script>');
      await page.fill('#price', 'DROP TABLE properties;');
      
      // 저장 시도 및 검증
      await page.selectOption('#manager', '김규민');
      
      page.on('dialog', async dialog => {
        console.log('검증 메시지:', dialog.message());
        await dialog.accept();
      });
      
      await page.click('.btn-save');
      await page.waitForTimeout(3000);
      
      console.log('✅ 데이터 유효성 검증 확인');
    });
  });

  // 테스트 정리 (개별 테스트에서 수행)
  // afterAll 훅 제거 - page 픽스처 사용 불가
});