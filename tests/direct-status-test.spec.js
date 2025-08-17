import { test, expect } from '@playwright/test';

test.describe('직접 상태 변경 알림 테스트', () => {
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
        } catch (e) {
          console.log('📤 슬랙 요청 파싱 실패');
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
      if (text.includes('매물') || text.includes('상태') || text.includes('슬랙') || text.includes('알림') || text.includes('updateProperty') || text.includes('notifyStatusChange')) {
        console.log(`브라우저 ${msg.type().toUpperCase()}: ${text}`);
      }
    });
  });

  test('직접 테스트 페이지에서 상태 변경 알림 테스트', async ({ page }) => {
    console.log('🚀 직접 테스트 페이지 실행 시작');
    
    // 테스트 페이지 열기
    await page.goto('file://' + process.cwd() + '/test-direct-status-change.html');
    await page.waitForLoadState('domcontentloaded');
    
    console.log('📄 테스트 페이지 로드 완료');
    
    // 페이지 스크립트 로드 대기
    await page.waitForTimeout(3000);
    
    // 1. 시스템 초기화
    console.log('🔧 1단계: 시스템 초기화');
    await page.click('button:has-text("시스템 초기화")');
    await page.waitForTimeout(2000);
    
    // 2. 시스템 상태 확인
    console.log('🔍 2단계: 시스템 상태 확인');
    await page.click('button:has-text("시스템 상태 확인")');
    await page.waitForTimeout(2000);
    
    // 시스템 상태 결과 확인
    const systemStatus = await page.locator('#system-status').textContent();
    console.log('시스템 상태:', systemStatus?.substring(0, 200) + '...');
    
    if (systemStatus?.includes('모든 시스템이 정상입니다')) {
      console.log('✅ 시스템 정상 확인');
    } else {
      console.log('⚠️ 시스템에 문제가 있을 수 있음');
    }
    
    // 3. 매물 목록 로드
    console.log('📋 3단계: 매물 목록 로드');
    await page.click('button:has-text("매물 목록 로드")');
    await page.waitForTimeout(5000); // 매물 로드 대기
    
    // 매물 개수 확인
    const propertyCount = await page.locator('#property-count').textContent();
    console.log('매물 로드 결과:', propertyCount);
    
    // 매물 목록이 표시되는지 확인
    const propertyListVisible = await page.locator('#property-list').isVisible();
    if (propertyListVisible) {
      console.log('✅ 매물 목록 표시 확인');
      
      // 4. 첫 번째 매물 선택
      console.log('🏠 4단계: 첫 번째 매물 선택');
      const firstProperty = page.locator('.property-item').first();
      await firstProperty.click();
      await page.waitForTimeout(1000);
      
      // 선택된 매물 정보 확인
      const selectedInfo = await page.locator('#selected-property').textContent();
      console.log('선택된 매물:', selectedInfo?.substring(0, 100) + '...');
      
      // 상태 선택기가 표시되는지 확인
      const statusSelectorVisible = await page.locator('#status-selector').isVisible();
      if (statusSelectorVisible) {
        console.log('✅ 상태 선택기 표시 확인');
        
        // 5. 상태 변경
        console.log('🔄 5단계: 상태 변경 시도');
        
        // 현재 상태와 다른 상태 찾기
        const currentStatusBtn = page.locator('.status-btn.current');
        const currentStatus = await currentStatusBtn.textContent();
        console.log('현재 상태:', currentStatus);
        
        // 다른 상태 선택
        let targetStatus = '거래완료';
        if (currentStatus === '거래완료') {
          targetStatus = '거래가능';
        }
        
        console.log(`상태 변경: ${currentStatus} → ${targetStatus}`);
        
        // 대상 상태 버튼 클릭
        await page.click(`.status-btn:has-text("${targetStatus}")`);
        await page.waitForTimeout(5000); // 상태 변경 처리 대기
        
        console.log('⏳ 상태 변경 처리 완료 대기...');
        
      } else {
        console.log('❌ 상태 선택기가 표시되지 않음');
      }
      
    } else {
      console.log('⚠️ 매물 목록이 표시되지 않음');
    }
    
    // 6. 알림 함수 직접 테스트
    console.log('🧪 6단계: 알림 함수 직접 테스트');
    await page.click('button:has-text("알림 함수 직접 호출")');
    await page.waitForTimeout(3000);
    
    // 알림 함수 결과 확인
    const notificationResult = await page.locator('#notification-result').textContent();
    console.log('알림 함수 결과:', notificationResult);
    
    // 7. 로그 분석
    console.log('\n=== 로그 분석 ===');
    
    // 중요한 콘솔 메시지 필터링
    const importantMessages = consoleMessages.filter(msg => 
      msg.text.includes('매물 수정') || 
      msg.text.includes('상태 변경') || 
      msg.text.includes('슬랙 알림') ||
      msg.text.includes('notifyStatusChange') ||
      msg.text.includes('updateProperty') ||
      msg.text.includes('알림 함수')
    );
    
    console.log(`📝 중요한 콘솔 메시지 ${importantMessages.length}개:`);
    importantMessages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.type}] ${msg.text}`);
    });
    
    // 슬랙 요청 분석
    console.log(`📨 슬랙 요청 ${slackRequests.length}개:`);
    slackRequests.forEach((req, index) => {
      console.log(`${index + 1}. ${req.payload.text || 'No text'}`);
      if (req.payload.blocks) {
        console.log(`   └─ ${req.payload.blocks.length}개 블록 포함`);
      }
    });
    
    // 8. 최종 결과 분석
    console.log('\n=== 최종 결과 ===');
    
    if (slackRequests.length > 0) {
      console.log('✅ 슬랙 알림 전송 성공!');
      
      const statusChangeAlert = slackRequests.find(req => 
        req.payload.text && req.payload.text.includes('상태 변경')
      );
      
      if (statusChangeAlert) {
        console.log('✅ 상태 변경 알림 확인됨!');
      } else {
        console.log('⚠️ 다른 유형의 알림이 전송됨');
      }
      
    } else {
      console.log('❌ 슬랙 알림이 전송되지 않음');
      
      // 문제 진단
      const hasSystemOk = systemStatus?.includes('모든 시스템이 정상');
      const hasPropertyLoad = propertyCount?.includes('로드 완료');
      const hasUpdateCall = importantMessages.some(msg => msg.text.includes('updateProperty'));
      const hasNotifyCall = importantMessages.some(msg => msg.text.includes('notifyStatusChange'));
      const hasSlackError = importantMessages.some(msg => msg.text.includes('슬랙') && msg.type === 'error');
      
      console.log('\n🔍 문제 진단:');
      console.log(`- 시스템 정상: ${hasSystemOk ? '✅' : '❌'}`);
      console.log(`- 매물 로드: ${hasPropertyLoad ? '✅' : '❌'}`);
      console.log(`- updateProperty 호출: ${hasUpdateCall ? '✅' : '❌'}`);
      console.log(`- notifyStatusChange 호출: ${hasNotifyCall ? '✅' : '❌'}`);
      console.log(`- 슬랙 오류: ${hasSlackError ? '❌' : '✅'}`);
      
      if (!hasSystemOk) {
        console.log('💡 시스템 초기화에 문제가 있습니다.');
      } else if (!hasPropertyLoad) {
        console.log('💡 매물 로드에 실패했습니다.');
      } else if (!hasUpdateCall) {
        console.log('💡 매물 업데이트 함수가 호출되지 않았습니다.');
      } else if (!hasNotifyCall) {
        console.log('💡 알림 함수가 호출되지 않았습니다.');
      } else if (hasSlackError) {
        console.log('💡 슬랙 전송 중 오류가 발생했습니다.');
      }
    }
    
    console.log(`\n📊 최종 통계:`);
    console.log(`- 슬랙 요청: ${slackRequests.length}개`);
    console.log(`- 콘솔 메시지: ${consoleMessages.length}개`);
    console.log(`- 중요 메시지: ${importantMessages.length}개`);
    
    // 전체 로그 내용 가져오기
    const debugLogContent = await page.locator('#debug-log').textContent();
    if (debugLogContent) {
      console.log('\n📋 브라우저 디버그 로그:');
      console.log(debugLogContent.substring(0, 1000) + (debugLogContent.length > 1000 ? '...' : ''));
    }
  });
});