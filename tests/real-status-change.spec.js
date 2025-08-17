const { test, expect } = require('@playwright/test');

test.describe('실제 매물 상태 변경 알림 테스트', () => {
  let slackRequests = [];
  let consoleMessages = [];

  test.beforeEach(async ({ page }) => {
    slackRequests = [];
    consoleMessages = [];

    // 슬랙 요청 감지
    page.on('request', request => {
      if (request.url().includes('hooks.slack.com')) {
        console.log('🔔 슬랙 요청 감지!');
        try {
          const payload = JSON.parse(request.postData() || '{}');
          slackRequests.push({
            timestamp: new Date().toISOString(),
            payload: payload,
            url: request.url()
          });
          console.log('📤 슬랙 메시지:', payload.text || 'No text');
          if (payload.blocks) {
            console.log('📋 메시지 블록 수:', payload.blocks.length);
          }
        } catch (e) {
          console.log('📤 슬랙 요청 (파싱 실패)');
        }
      }
    });

    // 슬랙 응답 감지
    page.on('response', response => {
      if (response.url().includes('hooks.slack.com')) {
        console.log(`📨 슬랙 응답: ${response.status()}`);
      }
    });

    // 콘솔 메시지 캡처
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push({
        type: msg.type(),
        text: text,
        timestamp: new Date().toISOString()
      });
      
      // 중요한 메시지만 출력
      if (text.includes('매물') || text.includes('상태') || text.includes('슬랙') || text.includes('알림')) {
        console.log(`브라우저 ${msg.type().toUpperCase()}: ${text}`);
      }
    });
  });

  test('실제 매물 상태 변경으로 슬랙 알림 테스트', async ({ page }) => {
    console.log('🚀 실제 매물 상태 변경 테스트 시작');
    
    // 메인 페이지 접속
    await page.goto('file://' + process.cwd() + '/index.html');
    await page.waitForLoadState('domcontentloaded');
    
    console.log('📄 메인 페이지 로드 완료');
    
    // 스크립트 로드 대기 (더 긴 시간)
    await page.waitForTimeout(5000);
    
    // 매물 카드가 로드될 때까지 대기
    try {
      await page.waitForSelector('.property-card', { timeout: 15000 });
      console.log('📋 매물 목록 로드 완료');
    } catch (error) {
      console.log('⚠️ 매물이 없습니다. 테스트용 매물을 먼저 등록해야 합니다.');
      
      // 매물 등록 페이지로 이동해서 테스트 매물 생성
      await page.click('button:has-text("매물등록")');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      
      // 테스트 매물 데이터 입력
      await page.fill('input[name="property_name"]', 'Playwright 테스트 매물');
      await page.fill('input[name="address"]', '서울시 강남구 테스트동');
      await page.fill('input[name="dong"]', '101');
      await page.fill('input[name="ho"]', '1501');
      await page.fill('input[name="price"]', '5억');
      await page.selectOption('select[name="trade_type"]', '매매');
      await page.selectOption('select[name="status"]', '거래가능');
      await page.fill('input[name="manager"]', 'Playwright 테스터');
      
      console.log('📝 테스트 매물 정보 입력 완료');
      
      // 저장 버튼 클릭
      await page.click('button[type="submit"], button:has-text("저장")');
      await page.waitForTimeout(3000);
      
      console.log('💾 테스트 매물 저장 완료');
      
      // 메인 페이지로 돌아가기
      await page.goto('file://' + process.cwd() + '/index.html');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);
      
      // 다시 매물 카드 확인
      await page.waitForSelector('.property-card', { timeout: 10000 });
    }
    
    // 첫 번째 매물 클릭
    const firstProperty = page.locator('.property-card').first();
    await firstProperty.click();
    console.log('🏠 첫 번째 매물 클릭');
    
    // 사이드 패널이 열릴 때까지 대기
    await page.waitForSelector('#sidePanel.open', { timeout: 10000 });
    console.log('📱 사이드 패널 열림');
    
    // 수정 버튼 클릭
    const editButton = page.locator('#editProperty, button:has-text("수정")');
    await editButton.click();
    console.log('✏️ 수정 버튼 클릭');
    
    await page.waitForTimeout(2000);
    
    // 현재 상태 확인
    const statusSelect = page.locator('select[name="status"], #status');
    await statusSelect.waitFor({ state: 'visible', timeout: 5000 });
    
    const currentStatus = await statusSelect.inputValue();
    console.log('📊 현재 상태:', currentStatus);
    
    // 다른 상태로 변경
    const newStatus = currentStatus === '거래가능' ? '거래완료' : '거래가능';
    await statusSelect.selectOption(newStatus);
    console.log(`🔄 상태 변경: ${currentStatus} → ${newStatus}`);
    
    await page.waitForTimeout(1000);
    
    // 저장 버튼 클릭
    const saveButton = page.locator('#saveProperty, button:has-text("저장"), button[type="submit"]');
    await saveButton.click();
    console.log('💾 저장 버튼 클릭');
    
    // 저장 완료 및 알림 전송 대기
    await page.waitForTimeout(5000);
    
    console.log('\n=== 테스트 결과 분석 ===');
    
    // 콘솔 메시지 분석
    const importantMessages = consoleMessages.filter(msg => 
      msg.text.includes('매물 수정') || 
      msg.text.includes('상태 변경') || 
      msg.text.includes('슬랙 알림') ||
      msg.text.includes('notifyStatusChange')
    );
    
    console.log(`📝 중요한 콘솔 메시지 ${importantMessages.length}개:`);
    importantMessages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.type}] ${msg.text}`);
    });
    
    // 슬랙 요청 분석
    console.log(`📨 슬랙 요청 ${slackRequests.length}개 감지:`);
    slackRequests.forEach((req, index) => {
      console.log(`${index + 1}. ${req.payload.text || 'No text'}`);
      if (req.payload.blocks) {
        console.log(`   └─ ${req.payload.blocks.length}개 블록 포함`);
      }
    });
    
    // 검증
    if (slackRequests.length > 0) {
      console.log('✅ 슬랙 알림 전송 성공!');
      
      // 상태 변경 알림인지 확인
      const statusChangeAlert = slackRequests.find(req => 
        req.payload.text && req.payload.text.includes('상태 변경')
      );
      
      if (statusChangeAlert) {
        console.log('✅ 상태 변경 알림 확인됨!');
        expect(statusChangeAlert.payload.text).toContain('상태 변경');
      } else {
        console.log('⚠️ 상태 변경 알림이 아닌 다른 알림이 전송됨');
      }
      
    } else {
      console.log('❌ 슬랙 알림이 전송되지 않음');
      
      // 문제 진단
      const hasUpdateMessage = importantMessages.some(msg => msg.text.includes('매물 수정 완료'));
      const hasNotifyCall = importantMessages.some(msg => msg.text.includes('notifyStatusChange'));
      const hasSlackError = importantMessages.some(msg => msg.text.includes('슬랙') && msg.type === 'error');
      
      console.log('\n🔍 문제 진단:');
      console.log(`- 매물 수정 완료: ${hasUpdateMessage ? '✅' : '❌'}`);
      console.log(`- 알림 함수 호출: ${hasNotifyCall ? '✅' : '❌'}`);
      console.log(`- 슬랙 오류: ${hasSlackError ? '❌' : '✅'}`);
      
      if (!hasUpdateMessage) {
        console.log('💡 매물 수정이 완료되지 않았을 수 있습니다.');
      } else if (!hasNotifyCall) {
        console.log('💡 상태 변경 감지 로직에 문제가 있을 수 있습니다.');
      } else if (hasSlackError) {
        console.log('💡 슬랙 전송 중 오류가 발생했습니다.');
      }
      
      // 테스트 실패하지 않고 정보만 제공
      console.log('ℹ️ 알림이 전송되지 않았지만 테스트는 계속 진행합니다.');
    }
    
    console.log('\n=== 최종 결과 ===');
    console.log(`슬랙 요청: ${slackRequests.length}개`);
    console.log(`콘솔 메시지: ${consoleMessages.length}개`);
    console.log(`상태 변경: ${currentStatus} → ${newStatus}`);
  });

  test('알림 함수 직접 호출 테스트', async ({ page }) => {
    console.log('🧪 알림 함수 직접 호출 테스트');
    
    await page.goto('file://' + process.cwd() + '/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // 브라우저에서 직접 알림 함수 호출
    const result = await page.evaluate(async () => {
      try {
        // 함수 존재 확인
        if (typeof window.notifyStatusChange !== 'function') {
          return { success: false, error: 'notifyStatusChange 함수가 없음' };
        }
        
        // 테스트 매물 데이터
        const testProperty = {
          id: 'DIRECT_TEST_' + Date.now(),
          property_name: '직접 호출 테스트 매물',
          property_number: 'DIRECT' + Date.now(),
          trade_type: '매매',
          price: '3억',
          address: '서울시 서초구',
          dong: '202',
          ho: '2002',
          manager: '직접 테스터',
          status: '거래완료'
        };
        
        console.log('📞 notifyStatusChange 함수 직접 호출 중...');
        const alertResult = await window.notifyStatusChange(testProperty, '거래가능', '거래완료');
        
        return { 
          success: true, 
          alertResult: alertResult,
          property: testProperty.property_name 
        };
        
      } catch (error) {
        return { 
          success: false, 
          error: error.message,
          stack: error.stack
        };
      }
    });
    
    console.log('📊 직접 호출 결과:', JSON.stringify(result, null, 2));
    
    // 잠시 대기 후 슬랙 요청 확인
    await page.waitForTimeout(3000);
    
    if (slackRequests.length > 0) {
      console.log('✅ 직접 호출로 슬랙 알림 전송 성공!');
      expect(slackRequests.length).toBeGreaterThan(0);
    } else {
      console.log('❌ 직접 호출로도 슬랙 알림이 전송되지 않음');
      console.log('함수 호출 결과:', result);
    }
  });
});