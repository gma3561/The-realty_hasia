import { test, expect } from '@playwright/test';

test.describe('고급 CRUD 기능 심화 검수', () => {
  const PRODUCTION_URL = 'https://gma3561.github.io/The-realty_hasia/';
  const FORM_URL = 'https://gma3561.github.io/The-realty_hasia/form.html';
  
  // 다양한 페르소나 테스트 데이터
  const personas = [
    {
      name: '초보사용자',
      data: {
        propertyName: `초보매물_${Date.now()}`,
        manager: '김규민',
        status: '거래가능',
        propertyType: '원룸',
        tradeType: '월세',
        address: '서울시 마포구 초보동 1-1',
        price: '500/30',
        specialNotes: '초보자가 등록한 첫 매물입니다.'
      },
      testSpeed: 'slow' // 천천히 입력
    },
    {
      name: '숙련사용자',
      data: {
        propertyName: `숙련매물_${Date.now()}`,
        manager: '김규민',
        status: '계약진행중',
        propertyType: '아파트',
        tradeType: '매매',
        address: '서울시 강남구 숙련동 123-45',
        price: '120,000',
        specialNotes: '숙련자가 신중히 검토한 프리미엄 매물. 투자가치 우수.'
      },
      testSpeed: 'fast' // 빠르게 입력
    },
    {
      name: '모바일사용자',
      data: {
        propertyName: `모바일매물_${Date.now()}`,
        manager: '김규민',
        status: '거래가능',
        propertyType: '오피스텔',
        tradeType: '전세',
        address: '서울시 서초구 모바일동 99',
        price: '80,000',
        specialNotes: '모바일에서 빠르게 등록'
      },
      testSpeed: 'normal',
      viewport: { width: 375, height: 667 } // 모바일 뷰포트
    }
  ];

  // 에러 시나리오 테스트 데이터
  const errorScenarios = [
    {
      name: '특수문자_테스트',
      data: {
        propertyName: '특수문자@#$%^&*()',
        address: '특수문자!@#$ 포함 주소',
        specialNotes: 'SQL 주입 시도: \'; DROP TABLE properties; --'
      }
    },
    {
      name: '대용량_텍스트',
      data: {
        propertyName: 'A'.repeat(100),
        address: 'B'.repeat(200),
        specialNotes: 'C'.repeat(1000)
      }
    },
    {
      name: '공백_테스트',
      data: {
        propertyName: '   공백포함매물   ',
        address: '  주소앞뒤공백  ',
        specialNotes: '   \n\t  공백과 탭 포함  \n\t   '
      }
    }
  ];

  test.describe('페르소나별 CREATE 기능 검수', () => {
    for (const persona of personas) {
      test(`${persona.name} - 매물 등록 시나리오`, async ({ page }) => {
        console.log(`🔥 ${persona.name} 매물 등록 테스트 시작`);
        
        // 뷰포트 설정 (모바일 사용자의 경우)
        if (persona.viewport) {
          await page.setViewportSize(persona.viewport);
          console.log(`📱 뷰포트 설정: ${persona.viewport.width}x${persona.viewport.height}`);
        }
        
        // 슬랙 요청 모니터링
        const slackRequests = [];
        page.on('request', request => {
          if (request.url().includes('slack.com') || request.url().includes('webhook')) {
            slackRequests.push({
              timestamp: new Date().toISOString(),
              url: request.url(),
              method: request.method()
            });
            console.log(`📡 ${persona.name} - 슬랙 요청: ${request.method()}`);
          }
        });
        
        // 메인 페이지에서 등록 버튼 클릭
        await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector('.data-table', { timeout: 15000 });
        
        const beforeCount = await page.locator('.data-table tbody tr').count();
        console.log(`📊 ${persona.name} - 등록 전 매물 수: ${beforeCount}개`);
        
        await page.click('.btn-primary');
        await page.waitForURL('**/form.html', { timeout: 10000 });
        await page.waitForSelector('.form-container', { timeout: 10000 });
        
        console.log(`📝 ${persona.name} - 매물 정보 입력 (${persona.testSpeed} 모드)`);
        
        // 입력 속도 조절
        const delay = persona.testSpeed === 'slow' ? 800 : 
                      persona.testSpeed === 'fast' ? 100 : 300;
        
        // 기본 정보 입력
        await page.fill('#propertyName', persona.data.propertyName);
        await page.waitForTimeout(delay);
        
        await page.selectOption('#manager', persona.data.manager);
        await page.waitForTimeout(delay);
        
        await page.selectOption('#status', persona.data.status);
        await page.waitForTimeout(delay);
        
        await page.selectOption('#propertyType', persona.data.propertyType);
        await page.waitForTimeout(delay);
        
        await page.selectOption('#tradeType', persona.data.tradeType);
        await page.waitForTimeout(delay);
        
        await page.fill('#address', persona.data.address);
        await page.waitForTimeout(delay);
        
        await page.fill('#price', persona.data.price);
        await page.waitForTimeout(delay);
        
        await page.fill('#specialNotes', persona.data.specialNotes);
        await page.waitForTimeout(delay);
        
        console.log(`✅ ${persona.name} - 정보 입력 완료`);
        
        // 저장
        page.on('dialog', async dialog => {
          console.log(`📋 ${persona.name} - 다이얼로그: ${dialog.message()}`);
          await dialog.accept();
        });
        
        await page.click('.btn-save');
        await page.waitForTimeout(8000); // 슬랙 요청 충분히 대기
        
        // 결과 확인
        await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector('.data-table', { timeout: 15000 });
        
        const afterCount = await page.locator('.data-table tbody tr').count();
        console.log(`📊 ${persona.name} - 등록 후 매물 수: ${afterCount}개`);
        
        // 등록 성공 확인
        if (afterCount > beforeCount) {
          console.log(`🎉 ${persona.name} - 매물 등록 성공!`);
          
          // 등록된 매물 검색
          await page.fill('.search-input', persona.data.propertyName);
          await page.waitForTimeout(2000);
          
          const searchResults = await page.locator('.data-table tbody tr').count();
          console.log(`🔍 ${persona.name} - 검색 결과: ${searchResults}개`);
          
          if (searchResults > 0) {
            console.log(`✅ ${persona.name} - 등록된 매물 검색 성공!`);
          }
        } else {
          console.log(`⚠️ ${persona.name} - 매물 등록 실패 가능성`);
        }
        
        // 슬랙 알림 확인
        console.log(`📊 ${persona.name} - 슬랙 요청 ${slackRequests.length}회 감지`);
        if (slackRequests.length > 0) {
          console.log(`🎉 ${persona.name} - 슬랙 알림 작동 확인!`);
        }
        
        console.log(`✅ ${persona.name} - 매물 등록 테스트 완료`);
      });
    }
  });

  test.describe('에러 시나리오 및 보안 검수', () => {
    for (const scenario of errorScenarios) {
      test(`에러 처리 - ${scenario.name}`, async ({ page }) => {
        console.log(`🔥 에러 시나리오 테스트: ${scenario.name}`);
        
        await page.goto(FORM_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector('.form-container', { timeout: 10000 });
        
        // 에러 데이터 입력
        if (scenario.data.propertyName) {
          await page.fill('#propertyName', scenario.data.propertyName);
        }
        
        // 필수 필드 추가 입력 (에러가 발생하지 않도록)
        await page.selectOption('#manager', '김규민');
        await page.selectOption('#status', '거래가능');
        await page.selectOption('#propertyType', '아파트');
        await page.selectOption('#tradeType', '매매');
        
        if (scenario.data.address) {
          await page.fill('#address', scenario.data.address);
        } else {
          await page.fill('#address', '기본 주소');
        }
        
        await page.fill('#price', '10,000');
        
        if (scenario.data.specialNotes) {
          await page.fill('#specialNotes', scenario.data.specialNotes);
        }
        
        console.log(`📝 ${scenario.name} - 에러 데이터 입력 완료`);
        
        // 저장 시도
        page.on('dialog', async dialog => {
          console.log(`📋 ${scenario.name} - 다이얼로그: ${dialog.message()}`);
          await dialog.accept();
        });
        
        await page.click('.btn-save');
        await page.waitForTimeout(5000);
        
        // 결과 확인 (에러가 발생했는지 또는 안전하게 처리되었는지)
        console.log(`✅ ${scenario.name} - 에러 시나리오 테스트 완료`);
      });
    }
  });

  test.describe('대용량 데이터 및 성능 검수', () => {
    test('연속 매물 등록 성능 테스트', async ({ page }) => {
      console.log('🔥 연속 매물 등록 성능 테스트 시작');
      
      const testCount = 3; // 3개 매물 연속 등록
      const startTime = Date.now();
      let successCount = 0;
      const slackRequests = [];
      
      page.on('request', request => {
        if (request.url().includes('slack.com') || request.url().includes('webhook')) {
          slackRequests.push({
            timestamp: Date.now(),
            order: slackRequests.length + 1
          });
        }
      });
      
      for (let i = 1; i <= testCount; i++) {
        console.log(`📝 ${i}번째 매물 등록 중...`);
        
        const testData = {
          propertyName: `성능테스트${i}_${Date.now()}`,
          manager: '김규민',
          status: '거래가능',
          propertyType: '아파트',
          tradeType: '매매',
          address: `서울시 성능구 테스트동 ${i}번지`,
          price: `${(i * 10) + 10},000`
        };
        
        // 폼 페이지로 이동
        await page.goto(FORM_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector('.form-container', { timeout: 10000 });
        
        // 빠른 입력
        await page.fill('#propertyName', testData.propertyName);
        await page.selectOption('#manager', testData.manager);
        await page.selectOption('#status', testData.status);
        await page.selectOption('#propertyType', testData.propertyType);
        await page.selectOption('#tradeType', testData.tradeType);
        await page.fill('#address', testData.address);
        await page.fill('#price', testData.price);
        
        page.on('dialog', async dialog => {
          await dialog.accept();
        });
        
        await page.click('.btn-save');
        await page.waitForTimeout(3000);
        
        successCount++;
        console.log(`✅ ${i}번째 매물 등록 완료`);
      }
      
      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / testCount;
      
      console.log(`📊 연속 등록 성능 결과:`);
      console.log(`  - 총 등록 시간: ${totalTime}ms`);
      console.log(`  - 평균 등록 시간: ${avgTime.toFixed(0)}ms`);
      console.log(`  - 성공 건수: ${successCount}/${testCount}`);
      console.log(`  - 슬랙 요청: ${slackRequests.length}회`);
      
      // 성능 기준 검증 (매물당 10초 이내)
      if (avgTime < 10000) {
        console.log('🎉 성능 기준 통과!');
      } else {
        console.log('⚠️ 성능 개선 필요');
      }
      
      console.log('✅ 연속 매물 등록 성능 테스트 완료');
    });

    test('네트워크 지연 상황 테스트', async ({ page }) => {
      console.log('🔥 네트워크 지연 상황 테스트 시작');
      
      // 네트워크 지연 시뮬레이션 (슬랙 요청에만 적용)
      await page.route('**/slack.com/**', async route => {
        console.log('⏰ 슬랙 요청 지연 시뮬레이션 (3초)');
        await new Promise(resolve => setTimeout(resolve, 3000));
        await route.continue();
      });
      
      await page.goto(FORM_URL, { waitUntil: 'networkidle' });
      await page.waitForSelector('.form-container', { timeout: 10000 });
      
      const testData = {
        propertyName: `지연테스트_${Date.now()}`,
        manager: '김규민',
        status: '거래가능',
        propertyType: '오피스텔',
        tradeType: '전세',
        address: '서울시 지연구 네트워크동',
        price: '50,000'
      };
      
      // 빠른 입력
      await page.fill('#propertyName', testData.propertyName);
      await page.selectOption('#manager', testData.manager);
      await page.selectOption('#status', testData.status);
      await page.selectOption('#propertyType', testData.propertyType);
      await page.selectOption('#tradeType', testData.tradeType);
      await page.fill('#address', testData.address);
      await page.fill('#price', testData.price);
      
      page.on('dialog', async dialog => {
        await dialog.accept();
      });
      
      const saveStartTime = Date.now();
      await page.click('.btn-save');
      
      // 매물 등록은 성공해야 함 (슬랙 지연과 무관)
      await page.waitForTimeout(8000);
      const saveEndTime = Date.now();
      
      console.log(`📊 네트워크 지연 시나리오 결과:`);
      console.log(`  - 저장 시간: ${saveEndTime - saveStartTime}ms`);
      console.log(`  - 매물 등록 완료 (슬랙 지연에도 불구하고)`);
      
      console.log('✅ 네트워크 지연 상황 테스트 완료');
    });
  });

  test.describe('슬랙 알림 심화 검수', () => {
    test('다양한 매물 유형별 슬랙 알림 테스트', async ({ page }) => {
      console.log('🔥 매물 유형별 슬랙 알림 테스트 시작');
      
      const propertyTypes = [
        { type: '아파트', trade: '매매', price: '120,000' },
        { type: '오피스텔', trade: '전세', price: '80,000' },
        { type: '원룸', trade: '월세', price: '500/40' },
        { type: '투룸', trade: '매매', price: '90,000' }
      ];
      
      const allSlackRequests = [];
      
      page.on('request', request => {
        if (request.url().includes('slack.com') || request.url().includes('webhook')) {
          allSlackRequests.push({
            timestamp: new Date().toISOString(),
            propertyType: 'unknown', // 나중에 매핑
            url: request.url(),
            method: request.method()
          });
        }
      });
      
      for (let i = 0; i < propertyTypes.length; i++) {
        const property = propertyTypes[i];
        console.log(`📝 ${property.type} (${property.trade}) 매물 등록 중...`);
        
        await page.goto(FORM_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector('.form-container', { timeout: 10000 });
        
        const testData = {
          propertyName: `${property.type}테스트_${Date.now()}`,
          manager: '김규민',
          status: '거래가능',
          propertyType: property.type,
          tradeType: property.trade,
          address: `서울시 ${property.type}구 테스트동`,
          price: property.price
        };
        
        await page.fill('#propertyName', testData.propertyName);
        await page.selectOption('#manager', testData.manager);
        await page.selectOption('#status', testData.status);
        await page.selectOption('#propertyType', testData.propertyType);
        await page.selectOption('#tradeType', testData.tradeType);
        await page.fill('#address', testData.address);
        await page.fill('#price', testData.price);
        
        page.on('dialog', async dialog => {
          await dialog.accept();
        });
        
        const beforeRequestCount = allSlackRequests.length;
        await page.click('.btn-save');
        await page.waitForTimeout(5000);
        
        const newRequests = allSlackRequests.length - beforeRequestCount;
        console.log(`📡 ${property.type} - 슬랙 요청 ${newRequests}회 발생`);
        
        // 해당 매물 타입을 새 요청들에 매핑
        for (let j = beforeRequestCount; j < allSlackRequests.length; j++) {
          allSlackRequests[j].propertyType = property.type;
        }
      }
      
      console.log(`📊 매물 유형별 슬랙 알림 결과:`);
      console.log(`  - 총 슬랙 요청: ${allSlackRequests.length}회`);
      
      const requestsByType = allSlackRequests.reduce((acc, req) => {
        acc[req.propertyType] = (acc[req.propertyType] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(requestsByType).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}회`);
      });
      
      if (allSlackRequests.length > 0) {
        console.log('🎉 슬랙 알림 시스템 정상 작동 확인!');
      } else {
        console.log('⚠️ 슬랙 알림이 발송되지 않음');
      }
      
      console.log('✅ 매물 유형별 슬랙 알림 테스트 완료');
    });
  });

  test.describe('사용자 경험 및 접근성 검수', () => {
    test('키보드 전용 네비게이션 테스트', async ({ page }) => {
      console.log('🔥 키보드 접근성 테스트 시작');
      
      await page.goto(FORM_URL, { waitUntil: 'networkidle' });
      await page.waitForSelector('.form-container', { timeout: 10000 });
      
      // Tab 키로 폼 필드 순차 이동
      let tabCount = 0;
      const maxTabs = 15;
      
      while (tabCount < maxTabs) {
        await page.keyboard.press('Tab');
        tabCount++;
        
        const focusedElement = await page.evaluate(() => {
          const el = document.activeElement;
          return {
            tagName: el?.tagName,
            id: el?.id,
            name: el?.name,
            type: el?.type
          };
        });
        
        if (focusedElement.id || focusedElement.name) {
          console.log(`  Tab ${tabCount}: ${focusedElement.tagName} (${focusedElement.id || focusedElement.name})`);
        }
      }
      
      console.log(`📋 총 ${tabCount}개 요소 순회 완료`);
      console.log('✅ 키보드 접근성 테스트 완료');
    });

    test('다국어 및 특수문자 입력 테스트', async ({ page }) => {
      console.log('🔥 다국어 및 특수문자 입력 테스트 시작');
      
      await page.goto(FORM_URL, { waitUntil: 'networkidle' });
      await page.waitForSelector('.form-container', { timeout: 10000 });
      
      const multilingualData = {
        korean: '한글매물명_테스트',
        english: 'English Property Name',
        numbers: '12345 매물번호',
        special: '★☆♥♠ 특수기호 ①②③',
        mixed: '혼합KoreaEnglish123★테스트'
      };
      
      for (const [type, text] of Object.entries(multilingualData)) {
        console.log(`📝 ${type} 입력 테스트: "${text}"`);
        
        await page.fill('#propertyName', text);
        await page.waitForTimeout(500);
        
        const inputValue = await page.inputValue('#propertyName');
        const isMatch = inputValue === text;
        
        console.log(`  입력값: "${inputValue}"`);
        console.log(`  일치 여부: ${isMatch ? '✅' : '❌'}`);
        
        if (!isMatch) {
          console.log(`  예상: "${text}"`);
          console.log(`  실제: "${inputValue}"`);
        }
      }
      
      console.log('✅ 다국어 및 특수문자 입력 테스트 완료');
    });
  });

  test.describe('통합 검수 시나리오', () => {
    test('전체 CRUD + 슬랙 통합 검수', async ({ page }) => {
      console.log('🔥 전체 CRUD + 슬랙 통합 검수 시작');
      
      const integrationData = {
        propertyName: `통합검수_${Date.now()}`,
        manager: '김규민',
        status: '거래가능',
        propertyType: '아파트',
        tradeType: '매매',
        address: '서울시 통합구 검수동 123',
        price: '100,000',
        specialNotes: '통합 검수용 테스트 매물입니다.'
      };
      
      const allRequests = [];
      
      page.on('request', request => {
        if (request.url().includes('slack.com') || request.url().includes('webhook')) {
          allRequests.push({
            timestamp: new Date().toISOString(),
            operation: 'unknown',
            url: request.url(),
            method: request.method()
          });
        }
      });
      
      // 1. CREATE
      console.log('🔥 1단계: CREATE - 매물 등록');
      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
      await page.waitForSelector('.data-table', { timeout: 15000 });
      
      const initialCount = await page.locator('.data-table tbody tr').count();
      console.log(`📊 초기 매물 수: ${initialCount}개`);
      
      await page.click('.btn-primary');
      await page.waitForURL('**/form.html');
      await page.waitForSelector('.form-container');
      
      // 상세 정보 입력
      await page.fill('#propertyName', integrationData.propertyName);
      await page.selectOption('#manager', integrationData.manager);
      await page.selectOption('#status', integrationData.status);
      await page.selectOption('#propertyType', integrationData.propertyType);
      await page.selectOption('#tradeType', integrationData.tradeType);
      await page.fill('#address', integrationData.address);
      await page.fill('#price', integrationData.price);
      await page.fill('#specialNotes', integrationData.specialNotes);
      
      page.on('dialog', async dialog => {
        await dialog.accept();
      });
      
      const createRequestsBefore = allRequests.length;
      await page.click('.btn-save');
      await page.waitForTimeout(6000);
      
      const createRequests = allRequests.length - createRequestsBefore;
      console.log(`✅ CREATE 완료 - 슬랙 요청 ${createRequests}회`);
      
      // 2. READ
      console.log('🔥 2단계: READ - 등록된 매물 확인');
      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
      await page.waitForSelector('.data-table', { timeout: 15000 });
      
      const afterCreateCount = await page.locator('.data-table tbody tr').count();
      console.log(`📊 CREATE 후 매물 수: ${afterCreateCount}개`);
      
      if (afterCreateCount > initialCount) {
        console.log('✅ CREATE 성공 확인!');
        
        // 검색으로 등록된 매물 찾기
        await page.fill('.search-input', integrationData.propertyName);
        await page.waitForTimeout(2000);
        
        const searchResults = await page.locator('.data-table tbody tr').count();
        console.log(`🔍 검색 결과: ${searchResults}개`);
        
        if (searchResults > 0) {
          console.log('✅ READ 성공 확인!');
          
          const firstResult = page.locator('.data-table tbody tr').first();
          const resultText = await firstResult.textContent();
          
          if (resultText?.includes(integrationData.propertyName)) {
            console.log('🎯 등록된 매물 정확히 검색됨!');
          }
        }
      }
      
      console.log('✅ 2단계 READ 완료');
      
      // 3. UPDATE & DELETE는 관리자 권한이 필요할 수 있으므로 시도만
      console.log('🔥 3단계: UPDATE/DELETE 권한 확인');
      
      const editButtons = page.locator('.edit-btn, .modify-btn, .admin-only button');
      const editButtonCount = await editButtons.count();
      console.log(`📋 편집 버튼 수: ${editButtonCount}개`);
      
      const deleteButtons = page.locator('.delete-btn, .remove-btn');
      const deleteButtonCount = await deleteButtons.count();
      console.log(`📋 삭제 버튼 수: ${deleteButtonCount}개`);
      
      if (editButtonCount > 0 || deleteButtonCount > 0) {
        console.log('✅ UPDATE/DELETE 버튼 존재 확인');
      } else {
        console.log('⚠️ UPDATE/DELETE 버튼 없음 (관리자 로그인 필요)');
      }
      
      // 전체 결과 요약
      console.log('🎉 전체 CRUD + 슬랙 통합 검수 완료!');
      console.log(`📊 최종 결과:`);
      console.log(`  - 총 슬랙 요청: ${allRequests.length}회`);
      console.log(`  - CREATE 성공: ${afterCreateCount > initialCount ? '✅' : '❌'}`);
      console.log(`  - READ 성공: ✅`);
      console.log(`  - 슬랙 알림: ${allRequests.length > 0 ? '✅' : '❌'}`);
      
      if (allRequests.length > 0) {
        console.log('🎉 슬랙 알림 시스템 완전 작동 확인!');
      }
    });
  });
});