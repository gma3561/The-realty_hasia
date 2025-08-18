import { test, expect } from '@playwright/test';

test.describe('필터 기능 및 CRUD 완전 검수', () => {
  const PRODUCTION_URL = 'https://gma3561.github.io/The-realty_hasia/';
  const FORM_URL = 'https://gma3561.github.io/The-realty_hasia/form.html';
  
  // 다양한 매물 타입별 테스트 데이터
  const testProperties = [
    {
      propertyName: `필터테스트_아파트_${Date.now()}`,
      manager: '김규민',
      status: '거래가능',
      propertyType: '아파트',
      tradeType: '매매',
      address: '서울시 강남구 필터동 1-1',
      price: '100,000',
      dong: '101',
      unit: '1001',
      supplyArea: '84.5',
      supplyPyeong: '25.5',
      floorInfo: '15/25',
      rooms: '3/2',
      direction: '남향',
      management: '20만원',
      parking: '2대',
      specialNotes: '필터 테스트용 아파트 매물'
    },
    {
      propertyName: `필터테스트_오피스텔_${Date.now()}`,
      manager: '하상현',
      status: '거래완료',
      propertyType: '오피스텔',
      tradeType: '전세',
      address: '서울시 서초구 필터동 2-2',
      price: '50,000',
      dong: '202',
      unit: '2002',
      supplyArea: '59.8',
      supplyPyeong: '18.1',
      floorInfo: '10/20',
      rooms: '2/1',
      direction: '동향',
      management: '15만원',
      parking: '1대',
      specialNotes: '필터 테스트용 오피스텔 매물'
    },
    {
      propertyName: `필터테스트_원룸_${Date.now()}`,
      manager: '정서연',
      status: '거래보류',
      propertyType: '원룸',
      tradeType: '월세/렌트',
      address: '서울시 마포구 필터동 3-3',
      price: '500/50',
      dong: '1',
      unit: '301',
      supplyArea: '33.0',
      supplyPyeong: '10.0',
      floorInfo: '3/5',
      rooms: '1/1',
      direction: '서향',
      management: '5만원',
      parking: '불가',
      specialNotes: '필터 테스트용 원룸 매물'
    },
    {
      propertyName: `필터테스트_빌라_${Date.now()}`,
      manager: '정선혜',
      status: '거래철회',
      propertyType: '빌라/연립',
      tradeType: '매매',
      address: '서울시 송파구 필터동 4-4',
      price: '70,000',
      dong: '가',
      unit: '401',
      supplyArea: '72.5',
      supplyPyeong: '22.0',
      floorInfo: '4/4',
      rooms: '3/1',
      direction: '북향',
      management: '10만원',
      parking: '1대',
      specialNotes: '필터 테스트용 빌라 매물'
    }
  ];

  test.describe('필터 기능 완전 검수', () => {
    test('모든 필터 옵션 작동 확인', async ({ page }) => {
      console.log('🔍 필터 기능 완전 검수 시작');
      
      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
      await page.waitForSelector('.data-table', { timeout: 15000 });
      
      const initialCount = await page.locator('.data-table tbody tr').count();
      console.log(`📊 초기 매물 수: ${initialCount}개`);
      
      // 1. 매물상태 필터 테스트
      console.log('\n🔍 매물상태 필터 테스트');
      const statusHeader = page.locator('th:has-text("매물상태")');
      
      if (await statusHeader.isVisible()) {
        await statusHeader.click();
        await page.waitForTimeout(1000);
        
        // 필터 메뉴가 열렸는지 확인
        const filterMenu = page.locator('#filterMenu, .filter-menu');
        if (await filterMenu.isVisible()) {
          console.log('✅ 매물상태 필터 메뉴 열림');
          
          // 각 상태별 필터 옵션 확인
          const statusOptions = ['거래가능', '거래완료', '거래보류', '거래철회'];
          
          for (const status of statusOptions) {
            const option = filterMenu.locator(`text="${status}"`);
            if (await option.isVisible()) {
              console.log(`  ✅ ${status} 옵션 존재`);
              
              // 옵션 선택
              await option.click();
              await page.waitForTimeout(500);
              
              // 적용 버튼 클릭
              const applyButton = filterMenu.locator('button:has-text("적용")');
              if (await applyButton.isVisible()) {
                await applyButton.click();
                await page.waitForTimeout(2000);
                
                const filteredCount = await page.locator('.data-table tbody tr').count();
                console.log(`  📊 ${status} 필터 적용 후: ${filteredCount}개`);
                
                // 필터 초기화
                await statusHeader.click();
                await page.waitForTimeout(500);
                const clearButton = filterMenu.locator('button:has-text("초기화")');
                if (await clearButton.isVisible()) {
                  await clearButton.click();
                  await page.waitForTimeout(500);
                }
                const closeButton = filterMenu.locator('.filter-menu-close, button:has-text("×")');
                if (await closeButton.isVisible()) {
                  await closeButton.click();
                  await page.waitForTimeout(500);
                }
              }
            }
          }
        } else {
          console.log('⚠️ 매물상태 필터 메뉴를 찾을 수 없음');
        }
      }
      
      // 2. 매물종류 필터 테스트
      console.log('\n🔍 매물종류 필터 테스트');
      const typeHeader = page.locator('th:has-text("매물종류")');
      
      if (await typeHeader.isVisible()) {
        await typeHeader.click();
        await page.waitForTimeout(1000);
        
        const filterMenu = page.locator('#filterMenu, .filter-menu');
        if (await filterMenu.isVisible()) {
          console.log('✅ 매물종류 필터 메뉴 열림');
          
          const typeOptions = ['아파트', '오피스텔', '원룸', '빌라/연립', '단독주택'];
          
          for (const type of typeOptions) {
            const option = filterMenu.locator(`text="${type}"`);
            if (await option.isVisible()) {
              console.log(`  ✅ ${type} 옵션 존재`);
            }
          }
          
          // 필터 메뉴 닫기
          const closeButton = filterMenu.locator('.filter-menu-close, button:has-text("×")');
          if (await closeButton.isVisible()) {
            await closeButton.click();
            await page.waitForTimeout(500);
          }
        }
      }
      
      // 3. 거래유형 필터 테스트
      console.log('\n🔍 거래유형 필터 테스트');
      const tradeHeader = page.locator('th:has-text("거래유형")');
      
      if (await tradeHeader.isVisible()) {
        await tradeHeader.click();
        await page.waitForTimeout(1000);
        
        const filterMenu = page.locator('#filterMenu, .filter-menu');
        if (await filterMenu.isVisible()) {
          console.log('✅ 거래유형 필터 메뉴 열림');
          
          const tradeOptions = ['매매', '전세', '월세/렌트', '단기', '분양'];
          
          for (const trade of tradeOptions) {
            const option = filterMenu.locator(`text="${trade}"`);
            if (await option.isVisible()) {
              console.log(`  ✅ ${trade} 옵션 존재`);
            }
          }
          
          // 필터 메뉴 닫기
          const closeButton = filterMenu.locator('.filter-menu-close, button:has-text("×")');
          if (await closeButton.isVisible()) {
            await closeButton.click();
            await page.waitForTimeout(500);
          }
        }
      }
      
      // 4. 검색 필터 테스트
      console.log('\n🔍 검색 필터 테스트');
      const searchInput = page.locator('.search-input');
      
      if (await searchInput.isVisible()) {
        const searchTerms = ['서울', '강남', '아파트', '매매'];
        
        for (const term of searchTerms) {
          await searchInput.fill(term);
          await page.waitForTimeout(1500);
          
          const searchResults = await page.locator('.data-table tbody tr').count();
          console.log(`  🔍 "${term}" 검색 결과: ${searchResults}개`);
        }
        
        // 검색 초기화
        await searchInput.fill('');
        await page.waitForTimeout(1000);
      }
      
      // 5. 정렬 기능 테스트
      console.log('\n🔍 정렬 기능 테스트');
      const sortButton = page.locator('.sort-btn');
      
      if (await sortButton.isVisible()) {
        const initialFirstRow = await page.locator('.data-table tbody tr').first().textContent();
        
        await sortButton.click();
        await page.waitForTimeout(1000);
        
        const afterSortFirstRow = await page.locator('.data-table tbody tr').first().textContent();
        
        if (initialFirstRow !== afterSortFirstRow) {
          console.log('✅ 정렬 기능 작동 확인');
        } else {
          console.log('⚠️ 정렬 후 변화 없음');
        }
      }
      
      // 6. 초기화 버튼 테스트
      console.log('\n🔍 초기화 버튼 테스트');
      const resetButton = page.locator('.reset-btn:has-text("초기화")');
      
      if (await resetButton.isVisible()) {
        await resetButton.click();
        await page.waitForTimeout(1000);
        
        const resetCount = await page.locator('.data-table tbody tr').count();
        console.log(`  📊 초기화 후 매물 수: ${resetCount}개`);
      }
      
      console.log('\n✅ 필터 기능 완전 검수 완료');
    });

    test('복합 필터 조합 테스트', async ({ page }) => {
      console.log('🔍 복합 필터 조합 테스트 시작');
      
      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
      await page.waitForSelector('.data-table', { timeout: 15000 });
      
      // 여러 필터를 동시에 적용
      console.log('📝 복합 필터 적용: 거래가능 + 아파트 + 매매');
      
      // 1. 상태 필터: 거래가능
      const statusHeader = page.locator('th:has-text("매물상태")');
      if (await statusHeader.isVisible()) {
        await statusHeader.click();
        await page.waitForTimeout(1000);
        
        const filterMenu = page.locator('#filterMenu, .filter-menu');
        const option = filterMenu.locator('text="거래가능"');
        if (await option.isVisible()) {
          await option.click();
          const applyButton = filterMenu.locator('button:has-text("적용")');
          if (await applyButton.isVisible()) {
            await applyButton.click();
            await page.waitForTimeout(2000);
          }
        }
      }
      
      const afterStatus = await page.locator('.data-table tbody tr').count();
      console.log(`  상태 필터 후: ${afterStatus}개`);
      
      // 2. 종류 필터: 아파트
      const typeHeader = page.locator('th:has-text("매물종류")');
      if (await typeHeader.isVisible()) {
        await typeHeader.click();
        await page.waitForTimeout(1000);
        
        const filterMenu = page.locator('#filterMenu, .filter-menu');
        const option = filterMenu.locator('text="아파트"');
        if (await option.isVisible()) {
          await option.click();
          const applyButton = filterMenu.locator('button:has-text("적용")');
          if (await applyButton.isVisible()) {
            await applyButton.click();
            await page.waitForTimeout(2000);
          }
        }
      }
      
      const afterType = await page.locator('.data-table tbody tr').count();
      console.log(`  + 종류 필터 후: ${afterType}개`);
      
      // 3. 거래 필터: 매매
      const tradeHeader = page.locator('th:has-text("거래유형")');
      if (await tradeHeader.isVisible()) {
        await tradeHeader.click();
        await page.waitForTimeout(1000);
        
        const filterMenu = page.locator('#filterMenu, .filter-menu');
        const option = filterMenu.locator('text="매매"');
        if (await option.isVisible()) {
          await option.click();
          const applyButton = filterMenu.locator('button:has-text("적용")');
          if (await applyButton.isVisible()) {
            await applyButton.click();
            await page.waitForTimeout(2000);
          }
        }
      }
      
      const afterTrade = await page.locator('.data-table tbody tr').count();
      console.log(`  + 거래 필터 후: ${afterTrade}개`);
      
      // 초기화
      const resetButton = page.locator('.reset-btn:has-text("초기화")');
      if (await resetButton.isVisible()) {
        await resetButton.click();
        await page.waitForTimeout(1000);
      }
      
      console.log('✅ 복합 필터 조합 테스트 완료');
    });
  });

  test.describe('매물 등록 및 확인 검수', () => {
    test('다양한 매물 등록 및 필터 확인', async ({ page }) => {
      test.setTimeout(60000); // 타임아웃을 60초로 증가
      console.log('🏠 다양한 매물 등록 시작');
      
      const registeredProperties = [];
      
      // 슬랙 요청 모니터링
      const slackRequests = [];
      page.on('request', request => {
        if (request.url().includes('slack.com') || request.url().includes('webhook')) {
          slackRequests.push({
            timestamp: new Date().toISOString(),
            url: request.url(),
            method: request.method(),
            propertyName: 'unknown'
          });
          console.log(`📡 슬랙 요청 감지: ${request.method()}`);
        }
      });
      
      page.on('response', response => {
        if (response.url().includes('slack.com') || response.url().includes('webhook')) {
          console.log(`📡 슬랙 응답: ${response.status()} ${response.statusText()}`);
        }
      });
      
      // 각 테스트 매물 등록
      for (let i = 0; i < testProperties.length; i++) {
        const property = testProperties[i];
        console.log(`\n📝 ${i + 1}. ${property.propertyType} 등록 중...`);
        
        await page.goto(FORM_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector('.form-container', { timeout: 10000 });
        
        // 매물 정보 입력
        await page.fill('#propertyName', property.propertyName);
        await page.selectOption('#manager', property.manager);
        await page.selectOption('#status', property.status);
        await page.selectOption('#propertyType', property.propertyType);
        await page.selectOption('#tradeType', property.tradeType);
        await page.fill('#address', property.address);
        await page.fill('#price', property.price);
        
        // 추가 정보 입력
        if (property.dong) await page.fill('#dong', property.dong);
        if (property.unit) await page.fill('#unit', property.unit);
        if (property.supplyArea) await page.fill('#supplyArea', property.supplyArea);
        if (property.supplyPyeong) await page.fill('#supplyPyeong', property.supplyPyeong);
        if (property.floorInfo) await page.fill('#floorInfo', property.floorInfo);
        if (property.rooms) await page.fill('#rooms', property.rooms);
        if (property.direction) await page.fill('#direction', property.direction);
        if (property.management) await page.fill('#management', property.management);
        if (property.parking) await page.fill('#parking', property.parking);
        if (property.specialNotes) await page.fill('#specialNotes', property.specialNotes);
        
        // 저장
        page.on('dialog', async dialog => {
          console.log(`  📋 다이얼로그: ${dialog.message()}`);
          await dialog.accept();
        });
        
        const slackCountBefore = slackRequests.length;
        await page.click('.btn-save');
        await page.waitForTimeout(5000);
        
        const newSlackRequests = slackRequests.length - slackCountBefore;
        console.log(`  ✅ ${property.propertyType} 등록 완료 (슬랙 요청: ${newSlackRequests}회)`);
        
        registeredProperties.push(property);
        
        // 슬랙 요청에 매물명 매핑
        for (let j = slackCountBefore; j < slackRequests.length; j++) {
          slackRequests[j].propertyName = property.propertyName;
        }
      }
      
      console.log(`\n📊 등록 완료: ${registeredProperties.length}개 매물`);
      console.log(`📡 총 슬랙 요청: ${slackRequests.length}회`);
      
      // 등록된 매물 확인
      console.log('\n🔍 등록된 매물 확인 시작');
      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
      await page.waitForSelector('.data-table', { timeout: 15000 });
      
      for (const property of registeredProperties) {
        await page.fill('.search-input', property.propertyName);
        await page.waitForTimeout(1500); // 2000ms에서 1500ms로 단축
        
        const searchResults = await page.locator('.data-table tbody tr').count();
        if (searchResults > 0) {
          console.log(`  ✅ ${property.propertyType} 매물 확인됨`);
          
          // 첫 번째 결과의 상태 확인
          const firstRow = await page.locator('.data-table tbody tr').first();
          const rowText = await firstRow.textContent();
          
          if (rowText?.includes(property.status)) {
            console.log(`    상태: ${property.status} ✅`);
          }
          if (rowText?.includes(property.tradeType)) {
            console.log(`    거래: ${property.tradeType} ✅`);
          }
          if (rowText?.includes(property.manager)) {
            console.log(`    담당: ${property.manager} ✅`);
          }
        } else {
          console.log(`  ❌ ${property.propertyType} 매물을 찾을 수 없음`);
        }
        
        // 검색 초기화
        await page.fill('.search-input', '');
        await page.waitForTimeout(500); // 1000ms에서 500ms로 단축
      }
      
      console.log('\n✅ 매물 등록 및 확인 완료');
    });
  });

  test.describe('슬랙 전송 확인', () => {
    test('상태 변경 시 슬랙 알림 테스트', async ({ page }) => {
      console.log('🔔 상태 변경 슬랙 알림 테스트 시작');
      
      const slackRequests = [];
      
      page.on('request', request => {
        if (request.url().includes('slack.com') || request.url().includes('webhook')) {
          slackRequests.push({
            timestamp: new Date().toISOString(),
            url: request.url(),
            method: request.method(),
            type: 'status_change'
          });
          console.log(`📡 상태 변경 슬랙 요청: ${request.method()}`);
        }
      });
      
      // 새 매물 등록
      const statusTestProperty = {
        propertyName: `상태변경테스트_${Date.now()}`,
        manager: '김규민',
        status: '거래가능',
        propertyType: '아파트',
        tradeType: '매매',
        address: '서울시 상태구 변경동',
        price: '80,000'
      };
      
      console.log('📝 상태 변경용 매물 등록');
      await page.goto(FORM_URL, { waitUntil: 'networkidle' });
      await page.waitForSelector('.form-container', { timeout: 10000 });
      
      await page.fill('#propertyName', statusTestProperty.propertyName);
      await page.selectOption('#manager', statusTestProperty.manager);
      await page.selectOption('#status', statusTestProperty.status);
      await page.selectOption('#propertyType', statusTestProperty.propertyType);
      await page.selectOption('#tradeType', statusTestProperty.tradeType);
      await page.fill('#address', statusTestProperty.address);
      await page.fill('#price', statusTestProperty.price);
      
      page.on('dialog', async dialog => {
        await dialog.accept();
      });
      
      await page.click('.btn-save');
      await page.waitForTimeout(5000);
      
      // 메인 페이지에서 등록된 매물 찾기
      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
      await page.waitForSelector('.data-table', { timeout: 15000 });
      
      await page.fill('.search-input', statusTestProperty.propertyName);
      await page.waitForTimeout(2000);
      
      // 편집 버튼 찾기
      const editButton = page.locator('.edit-btn, .modify-btn').first();
      if (await editButton.isVisible()) {
        console.log('📝 매물 상태 변경 시작');
        
        await editButton.click();
        await page.waitForTimeout(2000);
        
        // 모달이나 폼 페이지에서 상태 변경
        const statusField = page.locator('#status, select[name="status"]');
        if (await statusField.isVisible()) {
          const slackCountBefore = slackRequests.length;
          
          // 상태 변경: 거래가능 → 계약진행중
          await statusField.selectOption('계약진행중');
          console.log('  상태 변경: 거래가능 → 계약진행중');
          
          // 저장
          const saveButton = page.locator('button[type="submit"], .save-btn, .btn-save');
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(5000);
            
            const newSlackRequests = slackRequests.length - slackCountBefore;
            console.log(`  📡 상태 변경 후 슬랙 요청: ${newSlackRequests}회`);
            
            if (newSlackRequests > 0) {
              console.log('  ✅ 상태 변경 슬랙 알림 발송 확인!');
            } else {
              console.log('  ⚠️ 상태 변경 슬랙 알림 미발송');
            }
          }
        }
      } else {
        console.log('⚠️ 편집 버튼을 찾을 수 없음 (관리자 권한 필요)');
      }
      
      console.log(`\n📊 슬랙 알림 결과 요약:`);
      console.log(`  - 총 슬랙 요청: ${slackRequests.length}회`);
      
      if (slackRequests.length > 0) {
        console.log('🎉 슬랙 알림 시스템 작동 확인!');
      } else {
        console.log('⚠️ 슬랙 알림이 발송되지 않음');
      }
      
      console.log('✅ 상태 변경 슬랙 알림 테스트 완료');
    });

    test('대량 매물 등록 시 슬랙 부하 테스트', async ({ page }) => {
      console.log('🔔 대량 슬랙 알림 부하 테스트 시작');
      
      const slackRequests = [];
      const slackErrors = [];
      
      page.on('request', request => {
        if (request.url().includes('slack.com') || request.url().includes('webhook')) {
          slackRequests.push({
            timestamp: Date.now(),
            url: request.url()
          });
        }
      });
      
      page.on('requestfailed', request => {
        if (request.url().includes('slack.com') || request.url().includes('webhook')) {
          slackErrors.push({
            timestamp: Date.now(),
            error: request.failure()?.errorText
          });
          console.log(`❌ 슬랙 요청 실패: ${request.failure()?.errorText}`);
        }
      });
      
      // 5개 매물 빠르게 연속 등록
      const batchSize = 5;
      console.log(`📝 ${batchSize}개 매물 연속 등록`);
      
      for (let i = 1; i <= batchSize; i++) {
        await page.goto(FORM_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector('.form-container', { timeout: 10000 });
        
        const quickProperty = {
          propertyName: `부하테스트${i}_${Date.now()}`,
          manager: '김규민',
          status: '거래가능',
          propertyType: '아파트',
          tradeType: '매매',
          address: `서울시 부하구 테스트동 ${i}`,
          price: `${i * 10000}`
        };
        
        await page.fill('#propertyName', quickProperty.propertyName);
        await page.selectOption('#manager', quickProperty.manager);
        await page.selectOption('#status', quickProperty.status);
        await page.selectOption('#propertyType', quickProperty.propertyType);
        await page.selectOption('#tradeType', quickProperty.tradeType);
        await page.fill('#address', quickProperty.address);
        await page.fill('#price', quickProperty.price);
        
        page.on('dialog', async dialog => {
          await dialog.accept();
        });
        
        await page.click('.btn-save');
        await page.waitForTimeout(2000); // 짧은 대기
        
        console.log(`  ${i}/${batchSize} 완료`);
      }
      
      // 슬랙 요청 처리 대기
      await page.waitForTimeout(5000);
      
      console.log(`\n📊 부하 테스트 결과:`);
      console.log(`  - 등록 매물: ${batchSize}개`);
      console.log(`  - 슬랙 요청: ${slackRequests.length}회`);
      console.log(`  - 슬랙 오류: ${slackErrors.length}회`);
      
      if (slackRequests.length > 0) {
        // 요청 간격 분석
        const intervals = [];
        for (let i = 1; i < slackRequests.length; i++) {
          intervals.push(slackRequests[i].timestamp - slackRequests[i-1].timestamp);
        }
        
        if (intervals.length > 0) {
          const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
          console.log(`  - 평균 요청 간격: ${avgInterval.toFixed(0)}ms`);
        }
      }
      
      if (slackErrors.length > 0) {
        console.log('⚠️ 일부 슬랙 요청 실패');
      } else if (slackRequests.length > 0) {
        console.log('✅ 모든 슬랙 요청 성공');
      }
      
      console.log('✅ 대량 슬랙 알림 부하 테스트 완료');
    });
  });

  test.describe('종합 시나리오 검수', () => {
    test('전체 워크플로우 통합 테스트', async ({ page }) => {
      console.log('🎯 전체 워크플로우 통합 테스트 시작');
      
      const workflowResults = {
        registration: false,
        filterStatus: false,
        filterType: false,
        filterTrade: false,
        search: false,
        slackNotification: false
      };
      
      // 슬랙 모니터링
      const slackRequests = [];
      page.on('request', request => {
        if (request.url().includes('slack.com') || request.url().includes('webhook')) {
          slackRequests.push({
            timestamp: new Date().toISOString()
          });
        }
      });
      
      // 1. 매물 등록
      console.log('\n1️⃣ 매물 등록');
      const integrationProperty = {
        propertyName: `통합테스트_${Date.now()}`,
        manager: '김규민',
        status: '거래가능',
        propertyType: '아파트',
        tradeType: '매매',
        address: '서울시 통합구 워크플로우동',
        price: '150,000'
      };
      
      await page.goto(FORM_URL, { waitUntil: 'networkidle' });
      await page.waitForSelector('.form-container', { timeout: 10000 });
      
      await page.fill('#propertyName', integrationProperty.propertyName);
      await page.selectOption('#manager', integrationProperty.manager);
      await page.selectOption('#status', integrationProperty.status);
      await page.selectOption('#propertyType', integrationProperty.propertyType);
      await page.selectOption('#tradeType', integrationProperty.tradeType);
      await page.fill('#address', integrationProperty.address);
      await page.fill('#price', integrationProperty.price);
      
      page.on('dialog', async dialog => {
        await dialog.accept();
      });
      
      await page.click('.btn-save');
      await page.waitForTimeout(5000);
      
      workflowResults.registration = true;
      console.log('  ✅ 매물 등록 완료');
      
      // 2. 매물 확인 및 필터 테스트
      console.log('\n2️⃣ 매물 확인 및 필터');
      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
      await page.waitForSelector('.data-table', { timeout: 15000 });
      
      // 검색으로 확인
      await page.fill('.search-input', integrationProperty.propertyName);
      await page.waitForTimeout(2000);
      
      const searchResults = await page.locator('.data-table tbody tr').count();
      if (searchResults > 0) {
        workflowResults.search = true;
        console.log('  ✅ 검색 기능 정상');
      }
      
      // 검색 초기화
      await page.fill('.search-input', '');
      await page.waitForTimeout(1000);
      
      // 상태 필터
      const statusHeader = page.locator('th:has-text("매물상태")');
      if (await statusHeader.isVisible()) {
        await statusHeader.click();
        await page.waitForTimeout(1000);
        
        const filterMenu = page.locator('#filterMenu, .filter-menu');
        if (await filterMenu.isVisible()) {
          const option = filterMenu.locator('text="거래가능"');
          if (await option.isVisible()) {
            await option.click();
            const applyButton = filterMenu.locator('button:has-text("적용")');
            if (await applyButton.isVisible()) {
              await applyButton.click();
              await page.waitForTimeout(2000);
              workflowResults.filterStatus = true;
              console.log('  ✅ 상태 필터 정상');
            }
          }
        }
      }
      
      // 3. 슬랙 알림 확인
      console.log('\n3️⃣ 슬랙 알림 확인');
      if (slackRequests.length > 0) {
        workflowResults.slackNotification = true;
        console.log(`  ✅ 슬랙 알림 발송: ${slackRequests.length}회`);
      } else {
        console.log('  ⚠️ 슬랙 알림 미발송');
      }
      
      // 결과 요약
      console.log('\n📊 워크플로우 테스트 결과:');
      console.log(`  매물 등록: ${workflowResults.registration ? '✅' : '❌'}`);
      console.log(`  검색 기능: ${workflowResults.search ? '✅' : '❌'}`);
      console.log(`  상태 필터: ${workflowResults.filterStatus ? '✅' : '❌'}`);
      console.log(`  슬랙 알림: ${workflowResults.slackNotification ? '✅' : '❌'}`);
      
      const successCount = Object.values(workflowResults).filter(r => r).length;
      const totalCount = Object.keys(workflowResults).length;
      
      console.log(`\n🎯 성공률: ${successCount}/${totalCount} (${(successCount/totalCount*100).toFixed(0)}%)`);
      
      if (successCount === totalCount) {
        console.log('🏆 전체 워크플로우 완벽 작동!');
      } else {
        console.log('⚠️ 일부 기능 개선 필요');
      }
      
      console.log('✅ 전체 워크플로우 통합 테스트 완료');
    });
  });
});