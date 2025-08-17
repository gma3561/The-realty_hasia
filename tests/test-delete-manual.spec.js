const { test, expect } = require('@playwright/test');

test('수동 삭제 함수 테스트', async ({ page }) => {
  console.log('📌 수동 삭제 함수 테스트');
  
  // 콘솔 메시지 모니터링
  page.on('console', msg => {
    console.log(`[${msg.type()}]`, msg.text());
  });
  
  // 테스트 페이지 열기
  await page.goto('http://localhost:8888/tests/test-delete-function.html');
  
  // 5초 대기 (Supabase 초기화)
  await page.waitForTimeout(5000);
  
  // 버튼 클릭 전 상태 확인
  const readyText = await page.locator('#result').textContent();
  console.log('초기 상태:', readyText);
  
  // Test Delete 버튼 클릭
  await page.click('button');
  
  // 결과 대기
  await page.waitForTimeout(3000);
  
  // 결과 확인
  const result = await page.locator('#result').textContent();
  console.log('테스트 결과:\n', result);
  
  // 결과 분석
  if (result.includes('success": true')) {
    console.log('✅ 삭제 성공!');
  } else if (result.includes('success": false')) {
    console.log('❌ 삭제 실패');
    
    // 에러 메시지 추출
    const errorMatch = result.match(/"error":\s*({[^}]+}|"[^"]+"|[^,\n]+)/);
    if (errorMatch) {
      console.log('에러 상세:', errorMatch[1]);
    }
  } else {
    console.log('⚠️ 예상치 못한 결과');
  }
});