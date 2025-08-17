const { test, expect } = require('@playwright/test');

test('매물 등록 디버깅', async ({ page }) => {
  const PRODUCTION_URL = 'https://gma3561.github.io/The-realty_hasia/';
  
  console.log('1. form.html 접속');
  await page.goto(`${PRODUCTION_URL}form.html`);
  
  // 콘솔 메시지 출력
  page.on('console', msg => {
    console.log('브라우저 콘솔:', msg.text());
  });
  
  console.log('2. 10초 대기 (스크립트 로딩)');
  await page.waitForTimeout(10000);
  
  console.log('3. window.saveProperty 확인');
  const hasSaveProperty = await page.evaluate(() => {
    return typeof window.saveProperty === 'function';
  });
  
  console.log('window.saveProperty 존재:', hasSaveProperty);
  
  if (!hasSaveProperty) {
    console.log('4. saveProperty 함수가 없음. Supabase 확인');
    const hasSupabase = await page.evaluate(() => {
      return {
        client: !!window.supabaseClient,
        ready: window.supabaseReady || false,
        insertFunction: typeof window.insertProperty === 'function'
      };
    });
    console.log('Supabase 상태:', hasSupabase);
  }
  
  console.log('5. 저장 버튼 클릭 시도');
  
  // Alert 처리
  page.on('dialog', async dialog => {
    console.log('Alert 메시지:', dialog.message());
    await dialog.accept();
  });
  
  await page.click('.btn-save');
  await page.waitForTimeout(5000);
  
  console.log('테스트 완료');
});