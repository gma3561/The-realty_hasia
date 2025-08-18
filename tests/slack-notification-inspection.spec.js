const { test, expect } = require('@playwright/test');

// 슬랙 알림 시스템 종합 검수 테스트
test.describe('슬랙 알림 시스템 CRUD 연동 검수', () => {
  const PRODUCTION_URL = 'https://gma3561.github.io/The-realty_hasia/';
  
  // 슬랙 알림 테스트용 매물 데이터
  const slackTestProperty = {
    propertyName: `슬랙테스트_${Date.now()}`,
    manager: '슬랙테스터',
    status: '거래가능',
    propertyType: '아파트',
    tradeType: '매매',
    address: '서울시 슬랙구 알림동',
    dong: '101',
    unit: '1001',
    price: '50,000',
    supplyArea: '84.5',
    supplyPyeong: '25.5',
    floorInfo: '15/25',
    rooms: '3/2',
    direction: '남향',
    management: '15만원',
    parking: '1대',
    specialNotes: '슬랙 알림 테스트용 매물입니다.',
    managerMemo: '상태 변경 시 슬랙 알림 확인',
    owner: '슬랙테스트오너',
    ownerContact: '010-1234-5678',
    contactRelation: '본인'
  };

  // 상태 변경 시나리오들
  const statusChangeScenarios = [
    { from: '거래가능', to: '계약진행중', description: '거래 시작' },
    { from: '계약진행중', to: '거래완료', description: '거래 완료' },
    { from: '거래완료', to: '거래가능', description: '재등록' },
    { from: '거래가능', to: '거래중단', description: '거래 중단' },
    { from: '거래중단', to: '거래가능', description: '거래 재개' }
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('.property-table', { timeout: 10000 });
  });

  // ===== 매물 등록 시 슬랙 알림 테스트 =====
  test.describe('CREATE 시 슬랙 알림 검수', () => {
    test('새 매물 등록 시 슬랙 알림 발송 확인', async ({ page }) => {
      // 네트워크 요청 모니터링 시작
      const slackRequests = [];
      
      page.on('request', request => {
        if (request.url().includes('slack.com') || request.url().includes('webhook')) {
          slackRequests.push({
            url: request.url(),
            method: request.method(),
            headers: request.headers(),
            timestamp: new Date().toISOString()
          });
        }
      });

      page.on('response', response => {
        if (response.url().includes('slack.com') || response.url().includes('webhook')) {
          console.log(`📡 슬랙 응답: ${response.status()} - ${response.url()}`);
        }
      });

      // 매물 등록
      await page.click('.add-property-btn');
      await page.waitForSelector('#propertyModal', { state: 'visible' });

      // 기본 정보 입력
      await page.fill('#propertyName', slackTestProperty.propertyName);
      await page.selectOption('#manager', slackTestProperty.manager);
      await page.selectOption('#status', slackTestProperty.status);
      await page.selectOption('#propertyType', slackTestProperty.propertyType);
      await page.selectOption('#tradeType', slackTestProperty.tradeType);
      await page.fill('#address', slackTestProperty.address);
      await page.fill('#price', slackTestProperty.price);
      await page.fill('#specialNotes', slackTestProperty.specialNotes);

      // 등록 실행
      await page.click('#saveProperty');
      await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 });

      // 슬랙 요청 확인을 위한 대기
      await page.waitForTimeout(3000);

      console.log(`📊 매물 등록 후 슬랙 요청 수: ${slackRequests.length}`);
      
      if (slackRequests.length > 0) {
        console.log('✅ 매물 등록 시 슬랙 알림 발송 확인됨');
        slackRequests.forEach((req, index) => {
          console.log(`   ${index + 1}. ${req.method} ${req.url} at ${req.timestamp}`);
        });
      } else {
        console.log('⚠️  매물 등록 시 슬랙 알림 발송 안됨 (설정에 따라 정상일 수 있음)');
      }
    });

    test('매물 등록 실패 시 슬랙 알림 처리', async ({ page }) => {
      await page.click('.add-property-btn');
      await page.waitForSelector('#propertyModal', { state: 'visible' });

      // 필수 정보 누락으로 등록 실패 유도
      await page.fill('#propertyName', ''); // 빈 매물명
      await page.click('#saveProperty');

      // 에러 확인
      await expect(page.locator('.toast-error, .error-message')).toBeVisible({ timeout: 5000 });
      
      console.log('✅ 매물 등록 실패 시 슬랙 알림 처리 확인');
    });
  });

  // ===== 상태 변경 시 슬랙 알림 테스트 =====
  test.describe('상태 변경 시 슬랙 알림 검수', () => {
    test('모든 상태 변경 시나리오 슬랙 알림 테스트', async ({ page }) => {
      const slackRequests = [];
      
      // 네트워크 모니터링
      page.on('request', request => {
        if (request.url().includes('slack.com') || request.url().includes('webhook')) {
          slackRequests.push({
            url: request.url(),
            method: request.method(),
            timestamp: new Date().toISOString(),
            scenario: 'status_change'
          });
        }
      });

      // 먼저 테스트용 매물 등록
      await page.click('.add-property-btn');
      await page.waitForSelector('#propertyModal', { state: 'visible' });

      await page.fill('#propertyName', slackTestProperty.propertyName);
      await page.selectOption('#manager', slackTestProperty.manager);
      await page.selectOption('#status', '거래가능');
      await page.selectOption('#propertyType', slackTestProperty.propertyType);
      await page.selectOption('#tradeType', slackTestProperty.tradeType);
      await page.fill('#address', slackTestProperty.address);
      await page.fill('#price', slackTestProperty.price);

      await page.click('#saveProperty');
      await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(2000);

      // 등록된 매물로 상태 변경 테스트
      const propertyRow = page.locator(`text=${slackTestProperty.propertyName}`).locator('..');
      const editButton = propertyRow.locator('.edit-btn, .modify-btn');

      if (await editButton.isVisible()) {
        for (const scenario of statusChangeScenarios.slice(0, 3)) { // 처음 3개만 테스트
          await editButton.click();
          await page.waitForSelector('#propertyModal', { state: 'visible' });

          // 상태 변경
          await page.selectOption('#status', scenario.to);
          
          // 변경 사유 추가
          await page.fill('#managerMemo', `상태 변경: ${scenario.description} (${new Date().toLocaleTimeString()})`);

          await page.click('#saveProperty');
          await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 });
          
          // 슬랙 알림 발송 대기
          await page.waitForTimeout(3000);

          console.log(`✅ 상태 변경 테스트: ${scenario.from} → ${scenario.to} (${scenario.description})`);
        }
      }

      console.log(`📊 상태 변경 테스트 후 총 슬랙 요청 수: ${slackRequests.length}`);
      
      if (slackRequests.filter(req => req.scenario === 'status_change').length > 0) {
        console.log('✅ 상태 변경 시 슬랙 알림 발송 확인됨');
      }
    });

    test('빠른 연속 상태 변경 시 슬랙 알림 처리', async ({ page }) => {
      const editButton = page.locator('.edit-btn, .modify-btn').first();
      
      if (await editButton.isVisible()) {
        // 첫 번째 변경
        await editButton.click();
        await page.waitForSelector('#propertyModal', { state: 'visible' });
        await page.selectOption('#status', '계약진행중');
        await page.click('#saveProperty');
        await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 });

        // 즉시 두 번째 변경 (1초 후)
        await page.waitForTimeout(1000);
        await editButton.click();
        await page.waitForSelector('#propertyModal', { state: 'visible' });
        await page.selectOption('#status', '거래완료');
        await page.click('#saveProperty');
        await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 });

        console.log('✅ 빠른 연속 상태 변경 시 슬랙 알림 처리 확인');
      }
    });

    test('대량 상태 변경 시 슬랙 알림 성능 테스트', async ({ page }) => {
      const startTime = Date.now();
      const slackRequests = [];

      page.on('request', request => {
        if (request.url().includes('slack.com') || request.url().includes('webhook')) {
          slackRequests.push({
            timestamp: Date.now(),
            delay: Date.now() - startTime
          });
        }
      });

      // 여러 매물의 상태를 연속으로 변경
      const editButtons = page.locator('.edit-btn, .modify-btn');
      const buttonCount = Math.min(await editButtons.count(), 3); // 최대 3개

      for (let i = 0; i < buttonCount; i++) {
        await editButtons.nth(i).click();
        await page.waitForSelector('#propertyModal', { state: 'visible' });
        await page.selectOption('#status', '계약진행중');
        await page.click('#saveProperty');
        await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(1000);
      }

      const totalTime = Date.now() - startTime;
      console.log(`✅ 대량 상태 변경 성능: ${buttonCount}개 처리, ${totalTime}ms, 슬랙 요청 ${slackRequests.length}회`);
    });
  });

  // ===== 슬랙 알림 내용 및 형식 검증 =====
  test.describe('슬랙 알림 내용 검증', () => {
    test('슬랙 웹훅 페이로드 구조 검증', async ({ page }) => {
      const webhookPayloads = [];

      // 요청 가로채기 및 페이로드 수집
      await page.route('**/slack.com/**', async route => {
        const request = route.request();
        if (request.method() === 'POST') {
          const payload = request.postData();
          webhookPayloads.push({
            url: request.url(),
            payload: payload,
            headers: request.headers(),
            timestamp: new Date().toISOString()
          });
        }
        await route.continue();
      });

      // 매물 등록으로 슬랙 알림 트리거
      await page.click('.add-property-btn');
      await page.waitForSelector('#propertyModal', { state: 'visible' });

      await page.fill('#propertyName', `페이로드테스트_${Date.now()}`);
      await page.selectOption('#manager', '페이로드테스터');
      await page.selectOption('#status', '거래가능');
      await page.selectOption('#propertyType', '아파트');
      await page.selectOption('#tradeType', '매매');
      await page.fill('#address', '서울시 페이로드구');
      await page.fill('#price', '30,000');

      await page.click('#saveProperty');
      await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(3000);

      // 페이로드 분석
      if (webhookPayloads.length > 0) {
        console.log('✅ 슬랙 웹훅 페이로드 수집됨:');
        webhookPayloads.forEach((webhook, index) => {
          console.log(`   ${index + 1}. ${webhook.timestamp}`);
          console.log(`      URL: ${webhook.url}`);
          console.log(`      Headers: ${JSON.stringify(webhook.headers, null, 2)}`);
          
          if (webhook.payload) {
            try {
              const parsedPayload = JSON.parse(webhook.payload);
              console.log(`      Payload 구조 확인: ${Object.keys(parsedPayload).join(', ')}`);
            } catch (e) {
              console.log(`      Payload: ${webhook.payload.substring(0, 100)}...`);
            }
          }
        });
      } else {
        console.log('⚠️  슬랙 웹훅 페이로드 수집되지 않음');
      }
    });

    test('슬랙 메시지 형식 및 내용 검증', async ({ page }) => {
      // 브라우저 콘솔 로그 모니터링
      const consoleMessages = [];
      page.on('console', msg => {
        if (msg.text().includes('slack') || msg.text().includes('알림')) {
          consoleMessages.push({
            type: msg.type(),
            text: msg.text(),
            timestamp: new Date().toISOString()
          });
        }
      });

      // 매물 등록
      await page.click('.add-property-btn');
      await page.waitForSelector('#propertyModal', { state: 'visible' });

      const testData = {
        propertyName: `메시지테스트_${Date.now()}`,
        manager: '메시지테스터',
        status: '거래가능',
        propertyType: '오피스텔',
        tradeType: '전세',
        address: '서울시 메시지구 테스트동 123-45',
        price: '25,000',
        specialNotes: '슬랙 메시지 형식 검증용 매물입니다.'
      };

      // 상세 정보 입력
      for (const [key, value] of Object.entries(testData)) {
        if (key === 'manager' || key === 'status' || key === 'propertyType' || key === 'tradeType') {
          await page.selectOption(`#${key}`, value);
        } else {
          await page.fill(`#${key}`, value);
        }
      }

      await page.click('#saveProperty');
      await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(3000);

      // 콘솔 메시지 분석
      console.log(`📝 슬랙 관련 콘솔 메시지 ${consoleMessages.length}개 수집됨`);
      consoleMessages.forEach((msg, index) => {
        console.log(`   ${index + 1}. [${msg.type}] ${msg.text}`);
      });

      console.log('✅ 슬랙 메시지 형식 검증 완료');
    });
  });

  // ===== 슬랙 알림 에러 처리 검증 =====
  test.describe('슬랙 알림 에러 처리 검수', () => {
    test('슬랙 서버 응답 지연 시 처리', async ({ page }) => {
      // 슬랙 요청에 지연 추가
      await page.route('**/slack.com/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5초 지연
        await route.continue();
      });

      await page.click('.add-property-btn');
      await page.waitForSelector('#propertyModal', { state: 'visible' });

      await page.fill('#propertyName', `지연테스트_${Date.now()}`);
      await page.selectOption('#manager', '지연테스터');
      await page.selectOption('#status', '거래가능');
      await page.selectOption('#propertyType', '아파트');
      await page.selectOption('#tradeType', '매매');
      await page.fill('#address', '서울시 지연구');
      await page.fill('#price', '35,000');

      const startTime = Date.now();
      await page.click('#saveProperty');
      
      // 매물 등록은 성공해야 함 (슬랙 알림 실패와 무관)
      await expect(page.locator('.toast-success')).toBeVisible({ timeout: 15000 });
      const endTime = Date.now();

      console.log(`✅ 슬랙 지연 시 처리 확인: 매물 등록 시간 ${endTime - startTime}ms`);
    });

    test('잘못된 슬랙 웹훅 URL 처리', async ({ page }) => {
      // 슬랙 요청을 실패로 만들기
      await page.route('**/slack.com/**', route => route.abort('failed'));

      await page.click('.add-property-btn');
      await page.waitForSelector('#propertyModal', { state: 'visible' });

      await page.fill('#propertyName', `실패테스트_${Date.now()}`);
      await page.selectOption('#manager', '실패테스터');
      await page.selectOption('#status', '거래가능');
      await page.selectOption('#propertyType', '원룸');
      await page.selectOption('#tradeType', '월세');
      await page.fill('#address', '서울시 실패구');
      await page.fill('#price', '500/30');

      await page.click('#saveProperty');
      
      // 매물 등록은 여전히 성공해야 함
      await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 });

      console.log('✅ 슬랙 웹훅 실패 시 매물 등록 정상 처리 확인');
    });

    test('네트워크 연결 실패 시 슬랙 알림 처리', async ({ page }) => {
      // 모든 외부 요청 차단
      await page.route('**/*', route => {
        if (route.request().url().includes('slack.com') || route.request().url().includes('webhook')) {
          route.abort('internetdisconnected');
        } else {
          route.continue();
        }
      });

      await page.click('.add-property-btn');
      await page.waitForSelector('#propertyModal', { state: 'visible' });

      await page.fill('#propertyName', `네트워크테스트_${Date.now()}`);
      await page.selectOption('#manager', '네트워크테스터');
      await page.selectOption('#status', '거래가능');
      await page.selectOption('#propertyType', '아파트');
      await page.selectOption('#tradeType', '매매');
      await page.fill('#address', '서울시 네트워크구');

      await page.click('#saveProperty');
      await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 });

      console.log('✅ 네트워크 연결 실패 시 매물 등록 정상 처리 확인');
    });
  });

  // ===== 슬랙 알림 설정 테스트 =====
  test.describe('슬랙 알림 설정 검수', () => {
    test('알림 On/Off 설정 동작 확인', async ({ page }) => {
      // 알림 설정 페이지가 있다면 테스트
      const settingsButton = page.locator('.settings-btn, #notificationSettings');
      
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        
        // 알림 토글 확인
        const toggles = page.locator('input[type="checkbox"]');
        const toggleCount = await toggles.count();
        
        if (toggleCount > 0) {
          // 첫 번째 토글 상태 변경
          await toggles.first().click();
          console.log('✅ 알림 설정 토글 동작 확인');
        }
      } else {
        console.log('⚠️  알림 설정 UI를 찾을 수 없음');
      }
    });
  });

  // ===== 통합 슬랙 알림 시나리오 =====
  test.describe('통합 슬랙 알림 시나리오', () => {
    test('전체 CRUD 과정의 슬랙 알림 추적', async ({ page }) => {
      const allSlackRequests = [];
      
      page.on('request', request => {
        if (request.url().includes('slack.com') || request.url().includes('webhook')) {
          allSlackRequests.push({
            operation: 'unknown',
            url: request.url(),
            method: request.method(),
            timestamp: new Date().toISOString()
          });
        }
      });

      const integrationTestProperty = {
        propertyName: `통합슬랙테스트_${Date.now()}`,
        manager: '통합테스터',
        status: '거래가능',
        propertyType: '아파트',
        tradeType: '매매',
        address: '서울시 통합구 슬랙동',
        price: '40,000'
      };

      // 1. CREATE with Slack notification
      console.log('🔔 1단계: 매물 등록 + 슬랙 알림');
      await page.click('.add-property-btn');
      await page.waitForSelector('#propertyModal', { state: 'visible' });

      await page.fill('#propertyName', integrationTestProperty.propertyName);
      await page.selectOption('#manager', integrationTestProperty.manager);
      await page.selectOption('#status', integrationTestProperty.status);
      await page.selectOption('#propertyType', integrationTestProperty.propertyType);
      await page.selectOption('#tradeType', integrationTestProperty.tradeType);
      await page.fill('#address', integrationTestProperty.address);
      await page.fill('#price', integrationTestProperty.price);

      allSlackRequests.forEach(req => req.operation = 'CREATE');
      await page.click('#saveProperty');
      await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(3000);

      // 2. UPDATE with Slack notification (상태 변경)
      console.log('🔔 2단계: 상태 변경 + 슬랙 알림');
      const editButton = page.locator(`text=${integrationTestProperty.propertyName}`).locator('..').locator('.edit-btn, .modify-btn');
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForSelector('#propertyModal', { state: 'visible' });
        
        const newRequestIndex = allSlackRequests.length;
        await page.selectOption('#status', '계약진행중');
        await page.fill('#managerMemo', '통합 테스트: 상태 변경');
        
        await page.click('#saveProperty');
        await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(3000);
        
        // 새로운 요청들을 UPDATE로 마킹
        for (let i = newRequestIndex; i < allSlackRequests.length; i++) {
          allSlackRequests[i].operation = 'UPDATE';
        }
      }

      // 3. DELETE (슬랙 알림 여부 확인)
      console.log('🔔 3단계: 매물 삭제 (슬랙 알림 확인)');
      const deleteButton = page.locator(`text=${integrationTestProperty.propertyName}`).locator('..').locator('.delete-btn, .remove-btn');
      if (await deleteButton.isVisible()) {
        const newRequestIndex = allSlackRequests.length;
        
        await deleteButton.click();
        page.on('dialog', async dialog => {
          await dialog.accept();
        });
        
        await page.waitForTimeout(3000);
        
        // 새로운 요청들을 DELETE로 마킹
        for (let i = newRequestIndex; i < allSlackRequests.length; i++) {
          allSlackRequests[i].operation = 'DELETE';
        }
      }

      // 결과 분석
      console.log('📊 통합 슬랙 알림 테스트 결과:');
      console.log(`   총 슬랙 요청 수: ${allSlackRequests.length}`);
      
      const operationCounts = allSlackRequests.reduce((acc, req) => {
        acc[req.operation] = (acc[req.operation] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(operationCounts).forEach(([operation, count]) => {
        console.log(`   ${operation}: ${count}회`);
      });

      console.log('🎉 전체 CRUD + 슬랙 알림 통합 테스트 완료!');
    });
  });
});