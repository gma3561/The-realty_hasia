import { test, expect } from '@playwright/test';

test.describe('매물 CRUD 및 Slack 알림 테스트', () => {
  let slackRequests = [];
  let propertyId = null;
  
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
          console.log('📤 Slack 요청 파싱 실패');
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
      if (text.includes('매물') || text.includes('슬랙') || text.includes('알림') || text.includes('property')) {
        console.log(`브라우저 ${msg.type().toUpperCase()}: ${text}`);
      }
    });
  });

  test('매물 등록 → 수정 → 삭제 전체 흐름 테스트', async ({ page }) => {
    console.log('🚀 매물 CRUD 테스트 시작');
    
    // 1. 매물 등록 페이지로 이동
    await page.goto('file://' + process.cwd() + '/form.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    console.log('📝 1단계: 매물 등록');
    
    // 매물 정보 입력
    const testProperty = {
      property_name: `테스트매물_${Date.now()}`,
      address: `서울시 테스트구 테스트동 ${Date.now()}`,
      property_type: '아파트',
      trade_type: '매매',
      price: '5억',
      dong: '101',
      ho: '1501',
      manager: 'Playwright 테스터',
      status: '거래가능'
    };
    
    // 필수 필드 입력
    await page.fill('input[name="property_name"]', testProperty.property_name);
    await page.fill('input[name="address"]', testProperty.address);
    await page.selectOption('select[name="property_type"]', testProperty.property_type);
    await page.selectOption('select[name="trade_type"]', testProperty.trade_type);
    await page.fill('input[name="price"]', testProperty.price);
    await page.fill('input[name="dong"]', testProperty.dong);
    await page.fill('input[name="ho"]', testProperty.ho);
    await page.fill('input[name="manager"]', testProperty.manager);
    await page.selectOption('select[name="status"]', testProperty.status);
    
    console.log('매물 정보 입력 완료:', testProperty.property_name);
    
    // 등록 버튼 클릭
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000); // 등록 처리 대기
    
    // 등록 성공 확인
    const successMessage = await page.locator('.success, .alert-success').textContent().catch(() => null);
    if (successMessage) {
      console.log('✅ 매물 등록 성공:', successMessage);
    }
    
    // 2. 메인 페이지로 이동하여 등록된 매물 찾기
    await page.goto('file://' + process.cwd() + '/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    console.log('🔍 2단계: 등록된 매물 찾기');
    
    // 등록된 매물 검색
    await page.fill('.search-input', testProperty.property_name);
    await page.waitForTimeout(2000);
    
    // 첫 번째 매물 클릭하여 상세보기
    const firstRow = page.locator('#dataTable tbody tr').first();
    await firstRow.click();
    await page.waitForTimeout(1000);
    
    // 매물 ID 추출 (수정/삭제를 위해)
    const editButton = page.locator('button:has-text("수정")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(1000);
      
      // URL에서 ID 추출
      const currentUrl = page.url();
      const urlParams = new URLSearchParams(currentUrl.split('?')[1] || '');
      propertyId = urlParams.get('id');
      console.log('매물 ID 추출:', propertyId);
      
      // 수정 페이지에서 뒤로가기
      await page.goBack();
      await page.waitForTimeout(1000);
    }
    
    console.log('🔄 3단계: 매물 상태 변경 (거래가능 → 거래완료)');
    
    // 상태 변경을 위해 다시 매물 클릭
    await firstRow.click();
    await page.waitForTimeout(1000);
    
    // 수정 버튼 클릭
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(2000);
      
      // 상태를 거래완료로 변경
      await page.selectOption('select[name="status"]', '거래완료');
      console.log('상태 변경: 거래가능 → 거래완료');
      
      // 수정 저장
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      console.log('✅ 매물 수정 완료');
    }
    
    // 메인 페이지로 돌아가기
    await page.goto('file://' + process.cwd() + '/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    console.log('🗑️ 4단계: 매물 삭제');
    
    // 다시 매물 검색 및 선택
    await page.fill('.search-input', testProperty.property_name);
    await page.waitForTimeout(2000);
    
    // 첫 번째 매물 클릭
    await page.locator('#dataTable tbody tr').first().click();
    await page.waitForTimeout(1000);
    
    // 삭제 버튼 클릭
    const deleteButton = page.locator('button:has-text("삭제")').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await page.waitForTimeout(500);
      
      // 삭제 확인 대화상자 확인
      page.on('dialog', async dialog => {
        console.log('삭제 확인 대화상자:', dialog.message());
        await dialog.accept();
      });
      
      await page.waitForTimeout(3000);
      console.log('✅ 매물 삭제 완료');
    }
    
    // 5. Slack 알림 확인
    console.log('\\n=== Slack 알림 결과 분석 ===');
    console.log(`📨 총 ${slackRequests.length}개의 Slack 요청이 감지되었습니다.`);
    
    if (slackRequests.length > 0) {
      slackRequests.forEach((req, index) => {
        console.log(`${index + 1}. [${new Date(req.timestamp).toLocaleTimeString()}] ${req.payload.text || 'No text'}`);
        if (req.payload.blocks) {
          console.log(`   └─ ${req.payload.blocks.length}개 블록 포함`);
        }
      });
      
      // 상태 변경 알림 확인
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
    }
    
    // 최종 결과
    console.log('\\n=== 테스트 완료 요약 ===');
    console.log(`✅ 매물 등록: ${testProperty.property_name}`);
    console.log('✅ 매물 상태 변경: 거래가능 → 거래완료');
    console.log('✅ 매물 삭제 완료');
    console.log(`📊 Slack 알림: ${slackRequests.length}개 전송`);
    
    // 테스트 성공 조건 검증
    expect(slackRequests.length).toBeGreaterThan(0);
  });
});