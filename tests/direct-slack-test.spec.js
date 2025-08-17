import { test, expect } from '@playwright/test';

test.describe('직접 Slack 알림 테스트', () => {
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
    
    // 콘솔 메시지 캡처
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('알림') || text.includes('Slack') || text.includes('테스트') || text.includes('SUCCESS') || text.includes('ERROR')) {
        console.log(`브라우저 ${msg.type().toUpperCase()}: ${text}`);
      }
    });
  });

  test('Slack 알림 시스템 전체 테스트', async ({ page }) => {
    console.log('🚀 Slack 알림 시스템 전체 테스트 시작');
    
    // 테스트 페이지로 이동
    await page.goto('file://' + process.cwd() + '/test-slack-direct.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    console.log('📄 테스트 페이지 로드 완료');
    
    // 1. 시스템 상태 확인
    console.log('🔧 1단계: 시스템 상태 확인');
    await page.click('button:has-text("시스템 상태 확인")');
    await page.waitForTimeout(2000);
    
    const systemResult = await page.locator('#system-result').textContent();
    console.log('시스템 상태 결과:', systemResult?.substring(0, 100) + '...');
    
    if (systemResult?.includes('모든 시스템이 정상입니다')) {
      console.log('✅ 시스템 상태 정상 확인');
    } else {
      console.log('⚠️ 시스템에 문제가 있을 수 있음');
    }
    
    // 2. 간단한 메시지 테스트
    console.log('💬 2단계: 간단한 메시지 테스트');
    await page.click('button:has-text("간단 메시지 테스트")');
    await page.waitForTimeout(3000);
    
    const simpleResult = await page.locator('#simple-message-result').textContent();
    console.log('간단 메시지 결과:', simpleResult);
    
    // 3. 연결 테스트
    console.log('🔌 3단계: 연결 테스트');
    await page.click('button:has-text("연결 테스트")');
    await page.waitForTimeout(3000);
    
    const connectionResult = await page.locator('#connection-result').textContent();
    console.log('연결 테스트 결과:', connectionResult);
    
    // 4. 새 매물 알림 테스트
    console.log('🆕 4단계: 새 매물 알림 테스트');
    await page.click('button:has-text("새 매물 알림 테스트")');
    await page.waitForTimeout(5000);
    
    const newPropertyResult = await page.locator('#new-property-result').textContent();
    console.log('새 매물 알림 결과:', newPropertyResult);
    
    // 5. 상태 변경 알림 테스트
    console.log('🔄 5단계: 상태 변경 알림 테스트');
    await page.click('button:has-text("상태 변경 알림 테스트")');
    await page.waitForTimeout(5000);
    
    const statusChangeResult = await page.locator('#status-change-result').textContent();
    console.log('상태 변경 알림 결과:', statusChangeResult);
    
    // 6. 결과 분석
    console.log('\\n=== Slack 요청 분석 ===');
    console.log(`📨 총 ${slackRequests.length}개의 Slack 요청이 감지되었습니다.`);
    
    if (slackRequests.length > 0) {
      slackRequests.forEach((req, index) => {
        console.log(`${index + 1}. [${new Date(req.timestamp).toLocaleTimeString()}] ${req.payload.text || 'No text'}`);
        if (req.payload.blocks) {
          console.log(`   └─ ${req.payload.blocks.length}개 블록 포함`);
        }
      });
      
      // 각 유형의 알림 확인
      const simpleMessage = slackRequests.find(req => 
        req.payload.text && req.payload.text.includes('직접 테스트 메시지')
      );
      
      const connectionTest = slackRequests.find(req => 
        req.payload.text && req.payload.text.includes('슬랙 연결 테스트')
      );
      
      const newPropertyAlert = slackRequests.find(req => 
        req.payload.text && req.payload.text.includes('새 매물')
      );
      
      const statusChangeAlert = slackRequests.find(req => 
        req.payload.text && req.payload.text.includes('상태 변경')
      );
      
      console.log('\\n=== 알림 유형별 확인 ===');
      console.log(`간단 메시지: ${simpleMessage ? '✅' : '❌'}`);
      console.log(`연결 테스트: ${connectionTest ? '✅' : '❌'}`);
      console.log(`새 매물 알림: ${newPropertyAlert ? '✅' : '❌'}`);
      console.log(`상태 변경 알림: ${statusChangeAlert ? '✅' : '❌'}`);
      
    } else {
      console.log('❌ Slack 알림이 전송되지 않았습니다.');
    }
    
    // 7. 최종 결과
    console.log('\\n=== 최종 테스트 결과 ===');
    
    const successConditions = [
      { name: '시스템 정상', check: systemResult?.includes('모든 시스템이 정상') },
      { name: 'Slack 요청 감지', check: slackRequests.length > 0 },
      { name: '간단 메시지 성공', check: simpleResult?.includes('성공') },
      { name: '연결 테스트 성공', check: connectionResult?.includes('성공') }
    ];
    
    let passedTests = 0;
    successConditions.forEach(condition => {
      const status = condition.check ? '✅' : '❌';
      console.log(`${status} ${condition.name}`);
      if (condition.check) passedTests++;
    });
    
    console.log(`\\n📊 테스트 결과: ${passedTests}/${successConditions.length} 성공`);
    console.log(`📨 총 Slack 요청: ${slackRequests.length}개`);
    
    // 테스트 성공 조건: 최소 2개 이상의 Slack 요청이 있어야 함
    expect(slackRequests.length).toBeGreaterThanOrEqual(2);
    expect(passedTests).toBeGreaterThanOrEqual(3);
  });
});