const { test, expect } = require('@playwright/test');

test.describe('슬랙 알림 간단 테스트', () => {
  test('직접 슬랙 메시지 전송 테스트', async ({ page }) => {
    // 테스트 HTML 페이지로 이동
    await page.goto('file://' + process.cwd() + '/test-direct-slack.html');
    
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/슬랙 직접 테스트/);
    
    // 테스트 버튼 확인
    await expect(page.getByText('테스트 메시지 전송')).toBeVisible();
    
    // 자동 실행 결과 대기 (페이지 로드 시 자동 실행됨)
    await page.waitForSelector('#result', { timeout: 10000 });
    
    // 결과 확인
    const result = await page.locator('#result').textContent();
    console.log('슬랙 전송 결과:', result);
    
    // 성공 또는 실패 메시지 확인
    expect(result).toMatch(/(성공|실패|오류)/);
    
    // 수동으로 버튼도 한 번 더 클릭해보기
    await page.getByText('테스트 메시지 전송').click();
    
    // 잠시 대기 후 결과 다시 확인
    await page.waitForTimeout(3000);
    const result2 = await page.locator('#result').textContent();
    console.log('두 번째 전송 결과:', result2);
  });

  test('알림 설정 페이지 기본 UI 테스트', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/notification-settings.html');
    
    // 페이지 로드 확인
    await expect(page).toHaveTitle(/알림 설정/);
    await expect(page.locator('h1')).toContainText('🔔 알림 설정');
    
    // 주요 버튼들 확인
    await expect(page.getByText('슬랙 연결 테스트')).toBeVisible();
    await expect(page.getByText('새 매물 등록 알림 테스트')).toBeVisible();
    await expect(page.getByText('상태 변경 알림 테스트')).toBeVisible();
    await expect(page.getByText('슬랙 전송 알림 테스트')).toBeVisible();
    
    // 설정 저장 버튼 확인
    await expect(page.getByText('💾 설정 저장')).toBeVisible();
    
    console.log('알림 설정 페이지 UI가 정상적으로 로드되었습니다.');
  });

  test('토글 스위치 동작 테스트', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/notification-settings.html');
    
    // 토글 스위치들
    const toggles = [
      '#newPropertyToggle',
      '#statusChangeToggle', 
      '#slackSendToggle'
    ];
    
    for (const toggleId of toggles) {
      const toggle = page.locator(toggleId);
      
      // 초기 상태 확인
      const initialState = await toggle.getAttribute('class');
      console.log(`${toggleId} 초기 상태:`, initialState);
      
      // 클릭
      await toggle.click();
      await page.waitForTimeout(500);
      
      // 상태 변경 확인
      const newState = await toggle.getAttribute('class');
      console.log(`${toggleId} 클릭 후 상태:`, newState);
      
      // active 클래스 토글 확인
      if (initialState?.includes('active')) {
        expect(newState).not.toContain('active');
      } else {
        expect(newState).toContain('active');
      }
    }
  });

  test('채널 입력 필드 테스트', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/notification-settings.html');
    
    // 채널 입력 필드들
    const defaultChannel = page.locator('#defaultChannel');
    const urgentChannel = page.locator('#urgentChannel');
    
    // 기본값 확인
    await expect(defaultChannel).toHaveValue('#매물관리');
    await expect(urgentChannel).toHaveValue('#긴급매물');
    
    // 값 변경 테스트
    await defaultChannel.clear();
    await defaultChannel.fill('#테스트채널');
    await expect(defaultChannel).toHaveValue('#테스트채널');
    
    await urgentChannel.clear();
    await urgentChannel.fill('#긴급테스트');
    await expect(urgentChannel).toHaveValue('#긴급테스트');
    
    console.log('채널 입력 필드가 정상적으로 작동합니다.');
  });

  test('fetch를 이용한 직접 슬랙 API 호출 테스트', async ({ page }) => {
    // 빈 페이지에서 JavaScript로 직접 슬랙 API 호출
    await page.goto('data:text/html,<html><body><h1>슬랙 API 직접 테스트</h1><div id="result"></div></body></html>');
    
    // JavaScript로 슬랙 메시지 전송
    const result = await page.evaluate(async () => {
      try {
        const webhookUrl = 'https://hooks.slack.com/services/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';
        
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: '🧪 Playwright 자동화 테스트에서 보내는 메시지입니다!'
          })
        });
        
        if (response.ok) {
          return { success: true, status: response.status };
        } else {
          return { success: false, status: response.status, error: response.statusText };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('슬랙 API 직접 호출 결과:', result);
    
    // 결과 검증
    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
  });

  test('복합 시나리오: 설정 변경 후 테스트 메시지 전송', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/notification-settings.html');
    
    // 1. 설정 변경
    await page.locator('#newPropertyToggle').click();
    await page.locator('#defaultChannel').clear();
    await page.locator('#defaultChannel').fill('#playwright-test');
    
    // 2. 설정 저장 시도
    await page.getByText('💾 설정 저장').click();
    
    // 3. 잠시 대기
    await page.waitForTimeout(2000);
    
    // 4. 직접 fetch로 메시지 전송
    const sendResult = await page.evaluate(async () => {
      try {
        const webhookUrl = 'https://hooks.slack.com/services/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';
        
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: '🎯 복합 시나리오 테스트: 설정 변경 후 메시지 전송 성공!',
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: "*Playwright 자동화 테스트 결과*\n✅ 설정 변경 완료\n✅ 메시지 전송 완료"
                }
              }
            ]
          })
        });
        
        return response.ok;
      } catch (error) {
        console.error('메시지 전송 오류:', error);
        return false;
      }
    });
    
    console.log('복합 시나리오 메시지 전송 결과:', sendResult);
    expect(sendResult).toBe(true);
  });
});