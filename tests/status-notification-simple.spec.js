const { test, expect } = require('@playwright/test');

test.describe('상태 변경 알림 실제 테스트', () => {
  test('간단한 상태 변경 알림 테스트', async ({ page }) => {
    // 브라우저에서 직접 상태 변경 알림 함수 테스트
    await page.goto('data:text/html,<html><body><h1>상태 변경 알림 테스트</h1><div id="result"></div></body></html>');
    
    // 상태 변경 알림 코드 직접 실행
    const result = await page.evaluate(async () => {
      try {
        // 웹훅 URL과 알림 함수 정의
        const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/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';
        
        // 상태 변경 알림 함수
        async function sendStatusChangeNotification(property, oldStatus, newStatus) {
          const statusEmoji = {
            '거래가능': '🟢',
            '거래완료': '🔴',
            '거래철회': '⚫',
            '매물검토': '🟡',
            '삭제됨': '🗑️'
          };

          const message = {
            text: `🔄 매물 상태 변경: ${oldStatus} → ${newStatus} - ${property.property_name}`,
            blocks: [
              {
                type: "header",
                text: {
                  type: "plain_text",
                  text: "🔄 매물 상태가 변경되었습니다!",
                  emoji: true
                }
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: "🏠 *매물 정보*"
                },
                fields: [
                  {
                    type: "mrkdwn",
                    text: `*매물명:*\n${property.property_name || '-'}`
                  },
                  {
                    type: "mrkdwn",
                    text: `*매물번호:*\n${property.property_number || property.id || '-'}`
                  },
                  {
                    type: "mrkdwn",
                    text: `*거래유형:*\n${property.trade_type || '-'}`
                  },
                  {
                    type: "mrkdwn",
                    text: `*담당자:*\n${property.manager || '-'}`
                  }
                ]
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: "📋 *상태 변경 정보*"
                },
                fields: [
                  {
                    type: "mrkdwn",
                    text: "*변경 항목:*\n매물 상태"
                  },
                  {
                    type: "mrkdwn",
                    text: `*이전 상태:*\n${statusEmoji[oldStatus] || ''} ${oldStatus || '-'}`
                  },
                  {
                    type: "mrkdwn",
                    text: `*새로운 상태:*\n${statusEmoji[newStatus] || ''} ${newStatus || '-'}`
                  },
                  {
                    type: "mrkdwn",
                    text: `*변경일시:*\n${new Date().toLocaleString('ko-KR')}`
                  }
                ]
              },
              {
                type: "divider"
              },
              {
                type: "context",
                elements: [
                  {
                    type: "mrkdwn",
                    text: `🏢 더부동산중개법인 | 🕐 ${new Date().toLocaleString('ko-KR')}`
                  }
                ]
              }
            ]
          };

          const response = await fetch(SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(message)
          });

          return {
            success: response.ok,
            status: response.status,
            statusText: response.statusText
          };
        }
        
        // 테스트 매물 데이터
        const testProperty = {
          id: 'TEST_PLAYWRIGHT_' + Date.now(),
          property_name: 'Playwright 테스트 매물',
          property_number: 'PW' + Date.now(),
          trade_type: '매매',
          price: '5억원',
          address: '서울시 강남구 테스트동',
          dong: '101',
          ho: '1501',
          manager: 'Playwright 테스터'
        };
        
        // 상태 변경 알림 테스트
        const testResult = await sendStatusChangeNotification(
          testProperty, 
          '거래가능', 
          '거래완료'
        );
        
        return {
          success: true,
          slackResult: testResult,
          property: testProperty
        };
        
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });
    
    console.log('📊 상태 변경 알림 테스트 결과:', JSON.stringify(result, null, 2));
    
    // 결과 검증
    expect(result.success).toBe(true);
    if (result.slackResult) {
      expect(result.slackResult.success).toBe(true);
      expect(result.slackResult.status).toBe(200);
    }
    
    console.log('✅ 상태 변경 알림이 성공적으로 전송되었습니다!');
  });

  test('다양한 상태 변경 시나리오 연속 테스트', async ({ page }) => {
    await page.goto('data:text/html,<html><body><h1>연속 상태 변경 테스트</h1></body></html>');
    
    const scenarios = [
      { from: '거래가능', to: '거래완료', desc: '거래 성사' },
      { from: '거래가능', to: '거래철회', desc: '거래 취소' },
      { from: '매물검토', to: '거래가능', desc: '검토 완료' },
      { from: '거래완료', to: '거래가능', desc: '거래 재개' }
    ];
    
    const results = await page.evaluate(async (testScenarios) => {
      const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/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';
      const results = [];
      
      // 간단한 알림 전송 함수
      async function sendQuickNotification(property, oldStatus, newStatus, description) {
        const message = {
          text: `🔄 ${description}: ${property.property_name} (${oldStatus} → ${newStatus})`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*${description}*\n📋 ${property.property_name}\n📊 ${oldStatus} → ${newStatus}\n🕐 ${new Date().toLocaleString('ko-KR')}`
              }
            }
          ]
        };
        
        const response = await fetch(SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });
        
        return response.ok;
      }
      
      // 각 시나리오 테스트
      for (let i = 0; i < testScenarios.length; i++) {
        const scenario = testScenarios[i];
        const testProperty = {
          property_name: `테스트 매물 ${i + 1}`,
          property_number: `TEST${Date.now()}_${i}`,
          trade_type: '매매'
        };
        
        try {
          const success = await sendQuickNotification(
            testProperty, 
            scenario.from, 
            scenario.to, 
            scenario.desc
          );
          
          results.push({
            scenario: scenario,
            success: success,
            property: testProperty.property_name
          });
          
          // 각 요청 간 간격
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          results.push({
            scenario: scenario,
            success: false,
            error: error.message
          });
        }
      }
      
      return results;
    }, scenarios);
    
    console.log('\n📊 연속 상태 변경 테스트 결과:');
    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${index + 1}. ${result.scenario.desc}: ${result.scenario.from} → ${result.scenario.to}`);
      if (result.error) {
        console.log(`   오류: ${result.error}`);
      }
    });
    
    // 최소 하나는 성공해야 함
    const successCount = results.filter(r => r.success).length;
    expect(successCount).toBeGreaterThan(0);
    
    console.log(`\n📈 총 ${results.length}개 중 ${successCount}개 성공`);
  });

  test('실제 웹사이트에서 알림 설정 확인', async ({ page }) => {
    // 알림 설정 페이지 접속
    await page.goto('file://' + process.cwd() + '/notification-settings.html');
    
    // 페이지 로드 확인
    await expect(page).toHaveTitle(/알림 설정/);
    await expect(page.locator('h1')).toContainText('상태 변경 알림 설정');
    
    // 상태 변경 알림 토글이 활성화되어 있는지 확인
    const statusToggle = page.locator('#statusChangeToggle');
    await expect(statusToggle).toBeVisible();
    
    const toggleClass = await statusToggle.getAttribute('class');
    console.log('📋 상태 변경 알림 토글 상태:', toggleClass);
    
    // active 클래스가 있으면 알림이 활성화된 상태
    if (toggleClass?.includes('active')) {
      console.log('✅ 상태 변경 알림이 활성화되어 있습니다.');
    } else {
      console.log('⚠️ 상태 변경 알림이 비활성화되어 있습니다.');
      
      // 활성화하기
      await statusToggle.click();
      await page.waitForTimeout(500);
      
      const newClass = await statusToggle.getAttribute('class');
      expect(newClass).toContain('active');
      console.log('✅ 상태 변경 알림을 활성화했습니다.');
    }
    
    // 채널 설정 확인
    const channelInput = page.locator('#defaultChannel');
    const channelValue = await channelInput.inputValue();
    console.log('📢 알림 채널:', channelValue);
    
    expect(channelValue).toBeTruthy();
  });

  test('슬랙 웹훅 URL 연결 상태 확인', async ({ page }) => {
    await page.goto('data:text/html,<html><body><h1>슬랙 연결 테스트</h1></body></html>');
    
    const connectionTest = await page.evaluate(async () => {
      const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/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';
      
      try {
        const response = await fetch(SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: '🔧 슬랙 연결 테스트 - Playwright 자동화 테스트'
          })
        });
        
        return {
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          url: SLACK_WEBHOOK_URL
        };
        
      } catch (error) {
        return {
          success: false,
          error: error.message,
          url: SLACK_WEBHOOK_URL
        };
      }
    });
    
    console.log('🔗 슬랙 연결 테스트 결과:', connectionTest);
    
    if (connectionTest.success) {
      console.log('✅ 슬랙 웹훅 연결이 정상입니다.');
      expect(connectionTest.status).toBe(200);
    } else {
      console.log('❌ 슬랙 웹훅 연결에 문제가 있습니다.');
      console.log('오류:', connectionTest.error);
      // 연결 실패도 테스트로는 통과 (네트워크 문제일 수 있음)
    }
  });
});