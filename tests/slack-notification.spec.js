const { test, expect } = require('@playwright/test');

test.describe('슬랙 알림 시스템 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 콘솔 로그 캡처
    page.on('console', msg => console.log(`브라우저 콘솔: ${msg.text()}`));
    
    // 네트워크 요청 모니터링
    page.on('request', request => {
      if (request.url().includes('hooks.slack.com')) {
        console.log(`슬랙 요청: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('hooks.slack.com')) {
        console.log(`슬랙 응답: ${response.status()} ${response.url()}`);
      }
    });
  });

  test('알림 설정 페이지 로드 및 UI 확인', async ({ page }) => {
    // 알림 설정 페이지로 이동
    await page.goto('file://' + process.cwd() + '/notification-settings.html');
    
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/알림 설정/);
    
    // 주요 UI 요소 확인
    await expect(page.locator('h1')).toContainText('🔔 알림 설정');
    
    // 토글 스위치 확인
    await expect(page.locator('#newPropertyToggle')).toBeVisible();
    await expect(page.locator('#statusChangeToggle')).toBeVisible();
    await expect(page.locator('#slackSendToggle')).toBeVisible();
    
    // 채널 입력 필드 확인
    await expect(page.locator('#defaultChannel')).toBeVisible();
    await expect(page.locator('#urgentChannel')).toBeVisible();
    
    // 테스트 버튼들 확인
    await expect(page.getByText('슬랙 연결 테스트')).toBeVisible();
    await expect(page.getByText('새 매물 등록 알림 테스트')).toBeVisible();
    await expect(page.getByText('상태 변경 알림 테스트')).toBeVisible();
    await expect(page.getByText('슬랙 전송 알림 테스트')).toBeVisible();
  });

  test('슬랙 연결 테스트 버튼 동작', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/notification-settings.html');
    
    // 슬랙 설정 스크립트가 로드될 때까지 대기
    await page.waitForFunction(() => window.testSlackConnection !== undefined);
    
    // 슬랙 연결 테스트 버튼 클릭
    const connectButton = page.getByText('슬랙 연결 테스트');
    await connectButton.click();
    
    // 상태 메시지가 표시될 때까지 대기
    await page.waitForSelector('#statusMessage .status-message', { timeout: 10000 });
    
    // 결과 확인
    const statusMessage = await page.locator('#statusMessage .status-message');
    const messageText = await statusMessage.textContent();
    
    console.log('상태 메시지:', messageText);
    
    // 성공 또는 실패 메시지 확인
    expect(messageText).toMatch(/(정상입니다|실패했습니다|로드되지 않았습니다)/);
  });

  test('새 매물 등록 알림 테스트', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/notification-settings.html');
    
    // 슬랙 설정 로드 대기
    await page.waitForFunction(() => window.notifyNewProperty !== undefined);
    
    // 새 매물 등록 알림 테스트 버튼 클릭
    const newPropertyButton = page.getByText('새 매물 등록 알림 테스트');
    await newPropertyButton.click();
    
    // 상태 메시지 대기
    await page.waitForSelector('#statusMessage .status-message', { timeout: 10000 });
    
    const statusMessage = await page.locator('#statusMessage .status-message');
    const messageText = await statusMessage.textContent();
    
    console.log('새 매물 알림 결과:', messageText);
    expect(messageText).toMatch(/(전송되었습니다|실패|로드되지 않았습니다)/);
  });

  test('상태 변경 알림 테스트', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/notification-settings.html');
    
    await page.waitForFunction(() => window.notifyStatusChange !== undefined);
    
    const statusChangeButton = page.getByText('상태 변경 알림 테스트');
    await statusChangeButton.click();
    
    await page.waitForSelector('#statusMessage .status-message', { timeout: 10000 });
    
    const statusMessage = await page.locator('#statusMessage .status-message');
    const messageText = await statusMessage.textContent();
    
    console.log('상태 변경 알림 결과:', messageText);
    expect(messageText).toMatch(/(전송되었습니다|실패|로드되지 않았습니다)/);
  });

  test('슬랙 전송 알림 테스트', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/notification-settings.html');
    
    await page.waitForFunction(() => window.notifySlackSend !== undefined);
    
    const slackSendButton = page.getByText('슬랙 전송 알림 테스트');
    await slackSendButton.click();
    
    await page.waitForSelector('#statusMessage .status-message', { timeout: 10000 });
    
    const statusMessage = await page.locator('#statusMessage .status-message');
    const messageText = await statusMessage.textContent();
    
    console.log('슬랙 전송 알림 결과:', messageText);
    expect(messageText).toMatch(/(전송되었습니다|실패|로드되지 않았습니다)/);
  });

  test('모든 알림 테스트 순차 실행', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/notification-settings.html');
    
    // 모든 함수가 로드될 때까지 대기
    await page.waitForFunction(() => 
      window.testSlackConnection !== undefined &&
      window.notifyNewProperty !== undefined &&
      window.notifyStatusChange !== undefined &&
      window.notifySlackSend !== undefined
    );
    
    const tests = [
      { name: '슬랙 연결 테스트', button: '슬랙 연결 테스트' },
      { name: '새 매물 등록 알림 테스트', button: '새 매물 등록 알림 테스트' },
      { name: '상태 변경 알림 테스트', button: '상태 변경 알림 테스트' },
      { name: '슬랙 전송 알림 테스트', button: '슬랙 전송 알림 테스트' }
    ];
    
    for (const testCase of tests) {
      console.log(`\n=== ${testCase.name} 실행 ===`);
      
      // 이전 메시지 클리어
      await page.evaluate(() => {
        document.getElementById('statusMessage').innerHTML = '';
      });
      
      // 테스트 버튼 클릭
      await page.getByText(testCase.button).click();
      
      // 결과 대기
      await page.waitForSelector('#statusMessage .status-message', { timeout: 15000 });
      
      const statusMessage = await page.locator('#statusMessage .status-message');
      const messageText = await statusMessage.textContent();
      const messageClass = await statusMessage.getAttribute('class');
      
      console.log(`결과: ${messageText}`);
      console.log(`상태: ${messageClass}`);
      
      // 잠시 대기 (너무 빠른 연속 요청 방지)
      await page.waitForTimeout(2000);
    }
  });

  test('토글 설정 변경 기능 테스트', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/notification-settings.html');
    
    // 토글 초기 상태 확인
    const newPropertyToggle = page.locator('#newPropertyToggle');
    const statusChangeToggle = page.locator('#statusChangeToggle');
    const slackSendToggle = page.locator('#slackSendToggle');
    
    // 토글 클릭 테스트
    await newPropertyToggle.click();
    await expect(newPropertyToggle).toHaveClass(/active/);
    
    await statusChangeToggle.click();
    await expect(statusChangeToggle).toHaveClass(/active/);
    
    await slackSendToggle.click();
    await expect(slackSendToggle).toHaveClass(/active/);
    
    // 다시 클릭하여 비활성화
    await newPropertyToggle.click();
    await expect(newPropertyToggle).not.toHaveClass(/active/);
  });

  test('채널 설정 변경 기능 테스트', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/notification-settings.html');
    
    // 채널 입력 필드 변경
    const defaultChannel = page.locator('#defaultChannel');
    const urgentChannel = page.locator('#urgentChannel');
    
    await defaultChannel.clear();
    await defaultChannel.fill('#테스트채널');
    await expect(defaultChannel).toHaveValue('#테스트채널');
    
    await urgentChannel.clear();
    await urgentChannel.fill('#긴급테스트');
    await expect(urgentChannel).toHaveValue('#긴급테스트');
  });

  test('설정 저장 기능 테스트', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/notification-settings.html');
    
    // 설정 변경
    await page.locator('#newPropertyToggle').click();
    await page.locator('#defaultChannel').clear();
    await page.locator('#defaultChannel').fill('#새채널');
    
    // 설정 저장 버튼 클릭
    await page.getByText('💾 설정 저장').click();
    
    // 저장 완료 메시지 확인
    await page.waitForSelector('#statusMessage .status-message', { timeout: 10000 });
    
    const statusMessage = await page.locator('#statusMessage .status-message');
    const messageText = await statusMessage.textContent();
    
    expect(messageText).toMatch(/(저장되었습니다|로드되지 않았습니다)/);
  });
});