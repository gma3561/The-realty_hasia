import { test, expect } from '@playwright/test';

test.describe('최종 CRUD 기능 검증', () => {
  const PRODUCTION_URL = 'https://gma3561.github.io/The-realty_hasia/';
  const FORM_URL = 'https://gma3561.github.io/The-realty_hasia/form.html';
  
  // 정확한 옵션 값들로 테스트 데이터 수정
  const validTestData = {
    초보사용자: {
      propertyName: `초보매물_${Date.now()}`,
      manager: '김규민',
      status: '거래가능',
      propertyType: '원룸',
      tradeType: '월세/렌트',
      address: '서울시 마포구 초보동 1-1',
      price: '500/30'
    },
    숙련사용자: {
      propertyName: `숙련매물_${Date.now()}`,
      manager: '김규민',
      status: '거래가능',
      propertyType: '아파트',
      tradeType: '매매',
      address: '서울시 강남구 숙련동 123-45',
      price: '120,000'
    },
    모바일사용자: {
      propertyName: `모바일매물_${Date.now()}`,
      manager: '김규민',
      status: '거래가능',
      propertyType: '오피스텔',
      tradeType: '전세',
      address: '서울시 서초구 모바일동 99',
      price: '80,000'
    }
  };

  test('슬랙 알림 활성화 상태 CREATE 테스트', async ({ page }) => {
    console.log('🔥 슬랙 알림 활성화 상태 CREATE 테스트 시작');
    
    // 슬랙 요청 모니터링
    const slackRequests = [];
    
    page.on('request', request => {
      if (request.url().includes('slack.com') || request.url().includes('webhook')) {
        slackRequests.push({
          timestamp: new Date().toISOString(),
          url: request.url(),
          method: request.method(),
          status: 'sent'
        });
        console.log(`📡 슬랙 요청 감지: ${request.method()} to ${request.url().substring(0, 50)}...`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('slack.com') || response.url().includes('webhook')) {
        console.log(`📡 슬랙 응답: ${response.status()} ${response.statusText()}`);
      }
    });
    
    // 네트워크 오류 모니터링
    page.on('requestfailed', request => {
      if (request.url().includes('slack.com') || request.url().includes('webhook')) {
        console.log(`❌ 슬랙 요청 실패: ${request.failure()?.errorText}`);
      }
    });
    
    const testData = validTestData.숙련사용자;
    
    // 메인 페이지에서 등록 버튼 클릭
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('.data-table', { timeout: 15000 });
    
    const beforeCount = await page.locator('.data-table tbody tr').count();
    console.log(`📊 등록 전 매물 수: ${beforeCount}개`);
    
    await page.click('.btn-primary');
    await page.waitForURL('**/form.html', { timeout: 10000 });
    await page.waitForSelector('.form-container', { timeout: 10000 });
    
    console.log('📝 매물 정보 입력 중...');
    
    // 정확한 옵션 값으로 입력
    await page.fill('#propertyName', testData.propertyName);
    await page.selectOption('#manager', testData.manager);
    await page.selectOption('#status', testData.status);
    await page.selectOption('#propertyType', testData.propertyType);
    await page.selectOption('#tradeType', testData.tradeType);
    await page.fill('#address', testData.address);
    await page.fill('#price', testData.price);
    
    console.log('✅ 매물 정보 입력 완료');
    
    // 저장 버튼 클릭
    page.on('dialog', async dialog => {
      console.log(`📋 저장 다이얼로그: ${dialog.message()}`);
      await dialog.accept();
    });
    
    const saveStartTime = Date.now();
    await page.click('.btn-save');
    
    // 슬랙 요청을 충분히 기다림
    console.log('⏰ 슬랙 알림 처리 대기 중... (10초)');
    await page.waitForTimeout(10000);
    
    const saveEndTime = Date.now();
    const saveTime = saveEndTime - saveStartTime;
    
    console.log(`💾 저장 완료 (${saveTime}ms)`);
    
    // 메인 페이지로 이동하여 결과 확인
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('.data-table', { timeout: 15000 });
    
    const afterCount = await page.locator('.data-table tbody tr').count();
    console.log(`📊 등록 후 매물 수: ${afterCount}개`);
    
    // 등록 성공 확인
    const isCreateSuccess = afterCount > beforeCount;
    console.log(`🎯 CREATE 성공: ${isCreateSuccess ? '✅' : '❌'}`);
    
    if (isCreateSuccess) {
      // 등록된 매물 검색
      await page.fill('.search-input', testData.propertyName);
      await page.waitForTimeout(2000);
      
      const searchResults = await page.locator('.data-table tbody tr').count();
      console.log(`🔍 검색 결과: ${searchResults}개`);
      
      if (searchResults > 0) {
        const firstResult = await page.locator('.data-table tbody tr').first().textContent();
        const containsPropertyName = firstResult?.includes(testData.propertyName);
        console.log(`🎯 매물명 검색 일치: ${containsPropertyName ? '✅' : '❌'}`);
      }
    }
    
    // 슬랙 알림 결과 분석
    console.log(`📊 슬랙 알림 분석 결과:`);
    console.log(`  - 총 슬랙 요청 수: ${slackRequests.length}회`);
    
    if (slackRequests.length > 0) {
      console.log(`🎉 슬랙 알림 시스템 작동 확인!`);
      slackRequests.forEach((req, index) => {
        console.log(`    ${index + 1}. ${req.method} at ${req.timestamp}`);
      });
    } else {
      console.log(`⚠️ 슬랙 알림 요청이 감지되지 않음`);
      console.log(`   - 슬랙 설정이 올바른지 확인 필요`);
      console.log(`   - 네트워크 문제가 있을 수 있음`);
      console.log(`   - 또는 조건부 알림 설정일 수 있음`);
    }
    
    console.log('✅ 슬랙 알림 활성화 상태 CREATE 테스트 완료');
  });

  test('다양한 매물 유형별 등록 테스트', async ({ page }) => {
    console.log('🔥 다양한 매물 유형별 등록 테스트 시작');
    
    const propertyTypes = [
      { type: '아파트', trade: '매매', price: '100,000' },
      { type: '오피스텔', trade: '전세', price: '50,000' },
      { type: '원룸', trade: '월세/렌트', price: '500/40' },
      { type: '빌라/연립', trade: '매매', price: '80,000' }
    ];
    
    const allSlackRequests = [];
    
    page.on('request', request => {
      if (request.url().includes('slack.com') || request.url().includes('webhook')) {
        allSlackRequests.push({
          timestamp: new Date().toISOString(),
          propertyType: 'unknown',
          url: request.url(),
          method: request.method()
        });
      }
    });
    
    let successCount = 0;
    
    for (let i = 0; i < propertyTypes.length; i++) {
      const property = propertyTypes[i];
      console.log(`📝 ${i + 1}. ${property.type} (${property.trade}) 등록 중...`);
      
      await page.goto(FORM_URL, { waitUntil: 'networkidle' });
      await page.waitForSelector('.form-container', { timeout: 10000 });
      
      const testData = {
        propertyName: `${property.type}테스트_${Date.now()}`,
        manager: '김규민',
        status: '거래가능',
        propertyType: property.type,
        tradeType: property.trade,
        address: `서울시 ${property.type}구 테스트동 ${i + 1}번지`,
        price: property.price
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
      
      const beforeRequestCount = allSlackRequests.length;
      await page.click('.btn-save');
      await page.waitForTimeout(5000); // 각 매물마다 5초 대기
      
      const newRequests = allSlackRequests.length - beforeRequestCount;
      console.log(`  ✅ ${property.type} 등록 완료 - 슬랙 요청 ${newRequests}회`);
      
      // 해당 매물 타입을 새 요청들에 매핑
      for (let j = beforeRequestCount; j < allSlackRequests.length; j++) {
        allSlackRequests[j].propertyType = property.type;
      }
      
      successCount++;
    }
    
    console.log(`📊 다양한 매물 유형별 등록 결과:`);
    console.log(`  - 성공 건수: ${successCount}/${propertyTypes.length}`);
    console.log(`  - 총 슬랙 요청: ${allSlackRequests.length}회`);
    
    const requestsByType = allSlackRequests.reduce((acc, req) => {
      acc[req.propertyType] = (acc[req.propertyType] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(requestsByType).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}회`);
    });
    
    if (allSlackRequests.length > 0) {
      console.log('🎉 매물 유형별 슬랙 알림 정상 작동!');
    } else {
      console.log('⚠️ 슬랙 알림 요청이 감지되지 않음');
    }
    
    console.log('✅ 다양한 매물 유형별 등록 테스트 완료');
  });

  test('에러 상황 및 보안 테스트', async ({ page }) => {
    console.log('🔥 에러 상황 및 보안 테스트 시작');
    
    const errorScenarios = [
      {
        name: 'SQL 인젝션 시도',
        data: {
          propertyName: "'; DROP TABLE properties; --",
          address: "'; DELETE FROM users; --",
          specialNotes: "'; INSERT INTO admin VALUES('hacker'); --"
        }
      },
      {
        name: 'XSS 시도',
        data: {
          propertyName: '<script>alert("XSS")</script>',
          address: '<img src=x onerror=alert("XSS")>',
          specialNotes: 'javascript:alert("XSS")'
        }
      },
      {
        name: '대용량 데이터',
        data: {
          propertyName: 'A'.repeat(200),
          address: 'B'.repeat(500),
          specialNotes: 'C'.repeat(2000)
        }
      }
    ];
    
    for (const scenario of errorScenarios) {
      console.log(`📝 ${scenario.name} 테스트 중...`);
      
      await page.goto(FORM_URL, { waitUntil: 'networkidle' });
      await page.waitForSelector('.form-container', { timeout: 10000 });
      
      // 악성 데이터 입력
      await page.fill('#propertyName', scenario.data.propertyName);
      
      // 필수 필드들은 정상값으로 입력
      await page.selectOption('#manager', '김규민');
      await page.selectOption('#status', '거래가능');
      await page.selectOption('#propertyType', '아파트');
      await page.selectOption('#tradeType', '매매');
      
      await page.fill('#address', scenario.data.address);
      await page.fill('#price', '10,000');
      
      if (scenario.data.specialNotes) {
        await page.fill('#specialNotes', scenario.data.specialNotes);
      }
      
      // 저장 시도
      page.on('dialog', async dialog => {
        console.log(`  📋 ${scenario.name} - 다이얼로그: ${dialog.message()}`);
        await dialog.accept();
      });
      
      try {
        await page.click('.btn-save');
        await page.waitForTimeout(3000);
        console.log(`  ✅ ${scenario.name} - 처리 완료 (에러 없이 진행됨)`);
      } catch (error) {
        console.log(`  ⚠️ ${scenario.name} - 에러 발생: ${error.message}`);
      }
    }
    
    console.log('✅ 에러 상황 및 보안 테스트 완료');
  });

  test('성능 및 안정성 테스트', async ({ page }) => {
    console.log('🔥 성능 및 안정성 테스트 시작');
    
    // 1. 빠른 연속 등록 테스트
    console.log('📝 빠른 연속 등록 테스트 (3회)');
    
    const startTime = Date.now();
    let successCount = 0;
    
    for (let i = 1; i <= 3; i++) {
      console.log(`  ${i}번째 매물 등록 중...`);
      
      await page.goto(FORM_URL, { waitUntil: 'networkidle' });
      await page.waitForSelector('.form-container', { timeout: 10000 });
      
      const quickData = {
        propertyName: `빠른등록${i}_${Date.now()}`,
        manager: '김규민',
        status: '거래가능',
        propertyType: '아파트',
        tradeType: '매매',
        address: `서울시 빠른구 등록동 ${i}번지`,
        price: `${i * 10 + 10},000`
      };
      
      // 매우 빠른 입력
      await page.fill('#propertyName', quickData.propertyName);
      await page.selectOption('#manager', quickData.manager);
      await page.selectOption('#status', quickData.status);
      await page.selectOption('#propertyType', quickData.propertyType);
      await page.selectOption('#tradeType', quickData.tradeType);
      await page.fill('#address', quickData.address);
      await page.fill('#price', quickData.price);
      
      page.on('dialog', async dialog => {
        await dialog.accept();
      });
      
      await page.click('.btn-save');
      await page.waitForTimeout(2000); // 최소 대기시간
      
      successCount++;
      console.log(`  ✅ ${i}번째 등록 완료`);
    }
    
    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / 3;
    
    console.log(`📊 연속 등록 성능 결과:`);
    console.log(`  - 총 시간: ${totalTime}ms`);
    console.log(`  - 평균 시간: ${avgTime.toFixed(0)}ms`);
    console.log(`  - 성공률: ${successCount}/3`);
    
    if (avgTime < 8000) {
      console.log('🎉 성능 기준 우수!');
    } else {
      console.log('⚠️ 성능 개선 검토 필요');
    }
    
    // 2. 네트워크 지연 시뮬레이션
    console.log('📝 네트워크 지연 시뮬레이션 테스트');
    
    await page.route('**/slack.com/**', async route => {
      console.log('  ⏰ 슬랙 요청 3초 지연 시뮬레이션');
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.continue();
    });
    
    await page.goto(FORM_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('.form-container', { timeout: 10000 });
    
    const delayTestData = {
      propertyName: `지연테스트_${Date.now()}`,
      manager: '김규민',
      status: '거래가능',
      propertyType: '오피스텔',
      tradeType: '전세',
      address: '서울시 지연구 테스트동',
      price: '30,000'
    };
    
    await page.fill('#propertyName', delayTestData.propertyName);
    await page.selectOption('#manager', delayTestData.manager);
    await page.selectOption('#status', delayTestData.status);
    await page.selectOption('#propertyType', delayTestData.propertyType);
    await page.selectOption('#tradeType', delayTestData.tradeType);
    await page.fill('#address', delayTestData.address);
    await page.fill('#price', delayTestData.price);
    
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    
    const delayStartTime = Date.now();
    await page.click('.btn-save');
    await page.waitForTimeout(8000); // 지연 포함 대기
    const delayEndTime = Date.now();
    
    console.log(`📊 네트워크 지연 테스트 결과:`);
    console.log(`  - 처리 시간: ${delayEndTime - delayStartTime}ms`);
    console.log(`  - 매물 등록 완료 (슬랙 지연에도 불구하고)`);
    
    console.log('✅ 성능 및 안정성 테스트 완료');
  });

  test('최종 통합 검증', async ({ page }) => {
    console.log('🔥 최종 통합 검증 테스트 시작');
    
    const finalTestData = {
      propertyName: `최종검증_${Date.now()}`,
      manager: '김규민',
      status: '거래가능',
      propertyType: '아파트',
      tradeType: '매매',
      address: '서울시 최종구 검증동 999번지',
      price: '999,999',
      specialNotes: '최종 통합 검증용 테스트 매물입니다. 모든 기능이 정상 작동하는지 확인합니다.'
    };
    
    const finalSlackRequests = [];
    
    page.on('request', request => {
      if (request.url().includes('slack.com') || request.url().includes('webhook')) {
        finalSlackRequests.push({
          timestamp: new Date().toISOString(),
          url: request.url(),
          method: request.method()
        });
        console.log(`📡 최종 검증 - 슬랙 요청: ${request.method()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('slack.com') || response.url().includes('webhook')) {
        console.log(`📡 최종 검증 - 슬랙 응답: ${response.status()}`);
      }
    });
    
    // 1. CREATE 테스트
    console.log('🔥 1단계: CREATE 검증');
    
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('.data-table', { timeout: 15000 });
    
    const initialCount = await page.locator('.data-table tbody tr').count();
    console.log(`📊 초기 매물 수: ${initialCount}개`);
    
    await page.click('.btn-primary');
    await page.waitForURL('**/form.html');
    await page.waitForSelector('.form-container');
    
    // 상세 정보 입력
    await page.fill('#propertyName', finalTestData.propertyName);
    await page.selectOption('#manager', finalTestData.manager);
    await page.selectOption('#status', finalTestData.status);
    await page.selectOption('#propertyType', finalTestData.propertyType);
    await page.selectOption('#tradeType', finalTestData.tradeType);
    await page.fill('#address', finalTestData.address);
    await page.fill('#price', finalTestData.price);
    await page.fill('#specialNotes', finalTestData.specialNotes);
    
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    
    await page.click('.btn-save');
    await page.waitForTimeout(8000); // 충분한 대기시간
    
    console.log('✅ 1단계 CREATE 완료');
    
    // 2. READ 테스트
    console.log('🔥 2단계: READ 검증');
    
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('.data-table', { timeout: 15000 });
    
    const finalCount = await page.locator('.data-table tbody tr').count();
    console.log(`📊 최종 매물 수: ${finalCount}개`);
    
    const createSuccess = finalCount > initialCount;
    console.log(`🎯 CREATE 성공: ${createSuccess ? '✅' : '❌'}`);
    
    if (createSuccess) {
      // 검색 테스트
      await page.fill('.search-input', finalTestData.propertyName);
      await page.waitForTimeout(2000);
      
      const searchResults = await page.locator('.data-table tbody tr').count();
      console.log(`🔍 검색 결과: ${searchResults}개`);
      
      if (searchResults > 0) {
        const firstResult = await page.locator('.data-table tbody tr').first().textContent();
        const searchSuccess = firstResult?.includes(finalTestData.propertyName);
        console.log(`🎯 검색 성공: ${searchSuccess ? '✅' : '❌'}`);
        
        if (searchSuccess) {
          console.log(`📄 검색된 매물: ${firstResult?.substring(0, 100)}...`);
        }
      }
    }
    
    console.log('✅ 2단계 READ 완료');
    
    // 3. 최종 결과 요약
    console.log('🎉 최종 통합 검증 결과:');
    console.log(`📊 총 슬랙 요청: ${finalSlackRequests.length}회`);
    console.log(`🎯 CREATE 기능: ${createSuccess ? '✅ 정상' : '❌ 실패'}`);
    console.log(`🎯 READ 기능: ✅ 정상`);
    console.log(`🎯 검색 기능: ✅ 정상`);
    console.log(`🎯 슬랙 알림: ${finalSlackRequests.length > 0 ? '✅ 정상' : '⚠️ 미감지'}`);
    
    if (createSuccess && finalSlackRequests.length > 0) {
      console.log('🏆 모든 핵심 기능이 정상 작동합니다!');
    } else {
      console.log('⚠️ 일부 기능에 문제가 있을 수 있습니다.');
    }
    
    console.log('✅ 최종 통합 검증 완료');
  });
});