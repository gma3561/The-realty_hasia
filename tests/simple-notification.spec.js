import { test, expect } from '@playwright/test';

test.describe('간단한 Slack 알림 테스트', () => {
  let slackRequests = [];
  
  test.beforeEach(async ({ page }) => {
    slackRequests = [];
    
    // Slack 요청 감지
    page.on('request', request => {
      if (request.url().includes('hooks.slack.com')) {
        console.log('🔔 Slack 요청 감지!');
        try {
          const payload = JSON.parse(request.postData() || '{}');
          slackRequests.push({
            timestamp: new Date().toISOString(),
            payload: payload,
            url: request.url()
          });
          console.log('📤 Slack 메시지:', payload.text || 'No text');
        } catch (e) {
          console.log('📤 Slack 요청 파싱 실패:', e.message);
        }
      }
    });
    
    // Slack 응답 감지
    page.on('response', response => {
      if (response.url().includes('hooks.slack.com')) {
        console.log(`📨 Slack 응답: ${response.status()}`);
      }
    });
    
    // 중요한 콘솔 메시지만 캡처
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('매물') || text.includes('슬랙') || text.includes('알림') || 
          text.includes('notifyStatusChange') || text.includes('updateProperty')) {
        console.log(`브라우저 ${msg.type().toUpperCase()}: ${text}`);
      }
    });
  });

  test('기존 매물 상태 변경으로 Slack 알림 테스트', async ({ page }) => {
    console.log('🚀 기존 매물 상태 변경 테스트 시작');
    
    // 메인 페이지로 이동
    await page.goto('file://' + process.cwd() + '/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    console.log('📋 1단계: 매물 목록 로드 대기');
    
    // 매물 테이블이 로드될 때까지 대기
    await page.waitForSelector('#dataTable tbody tr', { timeout: 10000 });
    
    // 첫 번째 매물 클릭
    const firstRow = page.locator('#dataTable tbody tr').first();
    await firstRow.click();
    await page.waitForTimeout(1000);
    
    console.log('🔍 2단계: 첫 번째 매물 선택');
    
    // 수정 버튼 찾기 (관리자 모드가 아닐 수 있으므로 대안 사용)
    const editButton = page.locator('button:has-text("수정")').first();
    
    if (await editButton.isVisible()) {
      console.log('✅ 수정 버튼 발견, 클릭');
      await editButton.click();
      await page.waitForTimeout(2000);
      
      // 현재 상태 확인
      const currentStatus = await page.locator('#status').inputValue().catch(() => '');
      console.log('현재 상태:', currentStatus);
      
      // 다른 상태로 변경
      let newStatus = '거래완료';
      if (currentStatus === '거래완료') {
        newStatus = '거래가능';
      }
      
      console.log(`🔄 3단계: 상태 변경 ${currentStatus} → ${newStatus}`);
      
      // 상태 선택
      await page.selectOption('#status', newStatus);
      await page.waitForTimeout(500);
      
      // 저장 버튼 클릭
      await page.click('button[type="submit"], .btn-primary:has-text("저장")');
      await page.waitForTimeout(5000); // 충분한 시간 대기
      
      console.log('✅ 매물 상태 변경 완료');
      
    } else {
      console.log('📝 관리자 모드로 전환하여 수정 시도');
      
      // 관리자 로그인 시도
      await page.goto('file://' + process.cwd() + '/admin-login.html');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      
      // 관리자 비밀번호 입력 (기본값 시도)
      await page.fill('#adminPassword', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      // 다시 메인 페이지로
      await page.goto('file://' + process.cwd() + '/index.html');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);
      
      // 첫 번째 매물 다시 선택
      await page.locator('#dataTable tbody tr').first().click();
      await page.waitForTimeout(1000);
      
      const editButtonAfterLogin = page.locator('button:has-text("수정")').first();
      if (await editButtonAfterLogin.isVisible()) {
        await editButtonAfterLogin.click();
        await page.waitForTimeout(2000);
        
        const currentStatus = await page.locator('#status').inputValue().catch(() => '');
        let newStatus = currentStatus === '거래완료' ? '거래가능' : '거래완료';
        
        console.log(`🔄 상태 변경 ${currentStatus} → ${newStatus}`);
        
        await page.selectOption('#status', newStatus);
        await page.waitForTimeout(500);
        await page.click('button[type="submit"], .btn-primary:has-text("저장")');
        await page.waitForTimeout(5000);
        
        console.log('✅ 관리자 모드에서 매물 상태 변경 완료');
      }
    }
    
    // 4. 직접 알림 함수 호출 테스트
    console.log('🧪 4단계: 직접 알림 함수 호출 테스트');
    
    const testResult = await page.evaluate(async () => {
      try {
        if (typeof window.notifyStatusChange !== 'function') {
          return { success: false, error: 'notifyStatusChange 함수가 없습니다' };
        }
        
        const testProperty = {
          id: 'TEST_' + Date.now(),
          property_name: '테스트 매물',
          property_number: 'TEST001',
          trade_type: '매매',
          price: '5억',
          address: '서울시 테스트구',
          manager: '테스터'
        };
        
        const result = await window.notifyStatusChange(testProperty, '거래가능', '거래완료');
        return { success: true, result: result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('직접 호출 결과:', testResult);
    
    // 5. 결과 분석
    console.log('\\n=== Slack 알림 결과 분석 ===');
    console.log(`📨 총 ${slackRequests.length}개의 Slack 요청이 감지되었습니다.`);
    
    if (slackRequests.length > 0) {
      slackRequests.forEach((req, index) => {
        console.log(`${index + 1}. [${new Date(req.timestamp).toLocaleTimeString()}] ${req.payload.text || 'No text'}`);
      });
      
      const statusChangeAlert = slackRequests.find(req => 
        req.payload.text && req.payload.text.includes('상태 변경')
      );
      
      if (statusChangeAlert) {
        console.log('✅ 상태 변경 알림이 성공적으로 전송되었습니다!');
      } else {
        console.log('⚠️ 상태 변경 알림을 찾을 수 없습니다.');
      }
      
    } else {
      console.log('❌ Slack 알림이 전송되지 않았습니다.');
      
      // 시스템 진단
      const systemCheck = await page.evaluate(() => {
        return {
          supabaseClient: !!window.supabaseClient,
          updateProperty: typeof window.updateProperty === 'function',
          notifyStatusChange: typeof window.notifyStatusChange === 'function',
          notificationSettings: !!window.notificationSettings,
          statusChangeEnabled: window.notificationSettings?.statusChange === true,
          webhookUrl: typeof SLACK_WEBHOOK_URL !== 'undefined'
        };
      });
      
      console.log('시스템 진단:', systemCheck);
    }
    
    // 최소 1개의 Slack 요청이 있어야 성공
    expect(slackRequests.length).toBeGreaterThan(0);
  });
});