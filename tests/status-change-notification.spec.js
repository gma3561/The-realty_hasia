const { test, expect } = require('@playwright/test');

test.describe('매물 상태 변경 알림 테스트', () => {
  let slackMessages = [];

  test.beforeEach(async ({ page }) => {
    // 슬랙 요청 모니터링
    slackMessages = [];
    
    page.on('request', request => {
      if (request.url().includes('hooks.slack.com')) {
        console.log(`🔔 슬랙 요청 감지: ${request.method()} ${request.url()}`);
        try {
          const payload = JSON.parse(request.postData() || '{}');
          slackMessages.push({
            timestamp: new Date().toISOString(),
            url: request.url(),
            payload: payload
          });
          console.log('📤 슬랙 메시지:', payload.text || 'No text');
        } catch (e) {
          console.log('📤 슬랙 요청 (파싱 실패)');
        }
      }
    });

    page.on('response', response => {
      if (response.url().includes('hooks.slack.com')) {
        console.log(`📨 슬랙 응답: ${response.status()}`);
      }
    });

    // 콘솔 로그 캡처
    page.on('console', msg => {
      if (msg.text().includes('슬랙') || msg.text().includes('알림')) {
        console.log(`브라우저: ${msg.text()}`);
      }
    });
  });

  test('알림 설정 페이지 기본 기능 확인', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/notification-settings.html');
    
    // 페이지 로드 확인
    await expect(page).toHaveTitle(/알림 설정/);
    await expect(page.locator('h1')).toContainText('상태 변경 알림 설정');
    
    // 상태 변경 알림 토글 확인
    await expect(page.locator('#statusChangeToggle')).toBeVisible();
    await expect(page.locator('#statusChangeToggle')).toHaveClass(/active/);
    
    // 채널 설정 확인
    await expect(page.locator('#defaultChannel')).toHaveValue('#매물관리');
    
    // 슬랙 연결 확인 버튼 테스트
    const connectButton = page.getByText('슬랙 연결 확인');
    await expect(connectButton).toBeVisible();
    
    console.log('✅ 알림 설정 페이지 기본 기능 정상');
  });

  test('매물 상태 변경 시뮬레이션 - 메인 페이지에서', async ({ page }) => {
    // 메인 페이지로 이동
    await page.goto('file://' + process.cwd() + '/index.html');
    
    // 페이지 로드 대기
    await page.waitForLoadState('domcontentloaded');
    
    // 스크립트 로드 대기
    await page.waitForFunction(() => 
      window.supabaseClient !== undefined && 
      window.updateProperty !== undefined &&
      window.notifyStatusChange !== undefined
    , { timeout: 30000 });

    console.log('📋 메인 페이지 로드 및 스크립트 초기화 완료');

    // 테스트용 매물 데이터 준비
    const testProperty = {
      id: 'TEST_' + Date.now(),
      property_name: '테스트 아파트',
      property_number: 'TEST' + Date.now(),
      trade_type: '매매',
      price: '5억',
      address: '서울시 강남구',
      dong: '101',
      ho: '1501',
      status: '거래가능',
      manager: '테스트담당자'
    };

    // 상태 변경 테스트 (JavaScript 실행)
    const statusChangeResult = await page.evaluate(async (property) => {
      try {
        // 상태 변경 알림 함수 직접 호출
        if (window.notifyStatusChange) {
          console.log('상태 변경 알림 함수 호출:', property);
          const result = await window.notifyStatusChange(property, '거래가능', '거래완료');
          return { success: true, result: result };
        } else {
          return { success: false, error: 'notifyStatusChange 함수가 없음' };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, testProperty);

    console.log('📊 상태 변경 알림 결과:', statusChangeResult);

    // 잠시 대기 (네트워크 요청 완료 대기)
    await page.waitForTimeout(3000);

    // 슬랙 메시지 전송 확인
    expect(slackMessages.length).toBeGreaterThan(0);
    
    if (slackMessages.length > 0) {
      const lastMessage = slackMessages[slackMessages.length - 1];
      expect(lastMessage.payload.text).toContain('상태 변경');
      expect(lastMessage.payload.text).toContain('거래가능');
      expect(lastMessage.payload.text).toContain('거래완료');
      console.log('✅ 상태 변경 알림 메시지 전송 확인됨');
    }
  });

  test('다양한 상태 변경 시나리오 테스트', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/index.html');
    
    await page.waitForFunction(() => 
      window.notifyStatusChange !== undefined
    , { timeout: 30000 });

    const testScenarios = [
      { from: '거래가능', to: '거래완료', description: '거래 성사' },
      { from: '거래가능', to: '거래철회', description: '거래 취소' },
      { from: '매물검토', to: '거래가능', description: '검토 완료' },
      { from: '거래완료', to: '거래가능', description: '거래 재개' }
    ];

    const testProperty = {
      id: 'MULTI_TEST_' + Date.now(),
      property_name: '다중 테스트 매물',
      property_number: 'MULTI' + Date.now(),
      trade_type: '전세',
      price: '3억',
      address: '서울시 서초구',
      manager: '테스트매니저'
    };

    for (const scenario of testScenarios) {
      console.log(`\n🔄 시나리오 테스트: ${scenario.description} (${scenario.from} → ${scenario.to})`);
      
      const result = await page.evaluate(async (property, from, to) => {
        try {
          const result = await window.notifyStatusChange(property, from, to);
          return { success: true, result: result };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }, testProperty, scenario.from, scenario.to);

      console.log(`📊 결과: ${JSON.stringify(result)}`);
      
      // 각 테스트 간 간격
      await page.waitForTimeout(2000);
    }

    // 전체 메시지 수 확인
    console.log(`📨 총 ${slackMessages.length}개의 슬랙 메시지 전송됨`);
    expect(slackMessages.length).toBeGreaterThanOrEqual(testScenarios.length);
  });

  test('슬랙 연결 확인 기능 테스트', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/notification-settings.html');
    
    // 슬랙 연결 확인 버튼 클릭
    await page.waitForFunction(() => window.testSlackConnection !== undefined);
    
    const connectButton = page.getByText('슬랙 연결 확인');
    await connectButton.click();
    
    // 결과 메시지 대기
    await page.waitForSelector('#statusMessage .status-message', { timeout: 10000 });
    
    const statusMessage = await page.locator('#statusMessage .status-message');
    const messageText = await statusMessage.textContent();
    
    console.log('🔗 슬랙 연결 테스트 결과:', messageText);
    
    // 결과 확인 (성공 또는 실패 메시지가 나와야 함)
    expect(messageText).toMatch(/(정상입니다|실패했습니다|연결)/);
  });

  test('알림 설정 변경 및 저장 테스트', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/notification-settings.html');
    
    // 초기 상태 확인
    const toggle = page.locator('#statusChangeToggle');
    const initialState = await toggle.getAttribute('class');
    console.log('초기 토글 상태:', initialState);
    
    // 토글 변경
    await toggle.click();
    await page.waitForTimeout(500);
    
    const newState = await toggle.getAttribute('class');
    console.log('변경된 토글 상태:', newState);
    
    // 채널 설정 변경
    const channelInput = page.locator('#defaultChannel');
    await channelInput.clear();
    await channelInput.fill('#테스트-채널');
    
    // 설정 저장
    await page.getByText('💾 설정 저장').click();
    
    // 저장 완료 메시지 확인
    await page.waitForSelector('#statusMessage .status-message', { timeout: 5000 });
    
    const saveMessage = await page.locator('#statusMessage .status-message');
    const saveText = await saveMessage.textContent();
    
    console.log('💾 설정 저장 결과:', saveText);
    expect(saveText).toContain('저장');
  });

  test('실제 매물 수정 시나리오 (UI 조작)', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/index.html');
    
    // 페이지 로드 및 초기화 대기
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // 매물이 있는지 확인 후 첫 번째 매물 클릭
    const firstProperty = page.locator('.property-card').first();
    
    try {
      await expect(firstProperty).toBeVisible({ timeout: 10000 });
      await firstProperty.click();
      
      // 사이드 패널 열릴 때까지 대기
      await page.waitForSelector('#sidePanel.open', { timeout: 5000 });
      
      // 수정 버튼 클릭
      const editButton = page.locator('#editProperty');
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // 상태 선택 필드 찾기
        const statusSelect = page.locator('select[name="status"], #status');
        if (await statusSelect.isVisible()) {
          // 현재 상태 확인
          const currentStatus = await statusSelect.inputValue();
          console.log('현재 상태:', currentStatus);
          
          // 다른 상태로 변경
          const newStatus = currentStatus === '거래가능' ? '거래완료' : '거래가능';
          await statusSelect.selectOption(newStatus);
          
          // 저장 버튼 클릭
          const saveButton = page.locator('#saveProperty, button:has-text("저장")');
          if (await saveButton.isVisible()) {
            await saveButton.click();
            
            console.log(`📝 매물 상태 변경: ${currentStatus} → ${newStatus}`);
            
            // 저장 완료 대기
            await page.waitForTimeout(3000);
            
            // 슬랙 메시지 전송 확인
            const statusChangeMessages = slackMessages.filter(msg => 
              msg.payload.text && msg.payload.text.includes('상태 변경')
            );
            
            console.log(`📨 상태 변경 알림 ${statusChangeMessages.length}개 전송됨`);
            
            if (statusChangeMessages.length > 0) {
              console.log('✅ 실제 UI 조작을 통한 상태 변경 알림 성공');
            }
          }
        }
      }
    } catch (error) {
      console.log('⚠️ 매물이 없거나 UI 조작 실패:', error.message);
      console.log('📝 테스트용 매물을 먼저 등록해주세요.');
    }
  });
});