const { test, expect } = require('@playwright/test');

test('최종 디버깅 - 스크립트 로딩 확인', async ({ page }) => {
  const PRODUCTION_URL = 'https://gma3561.github.io/The-realty_hasia/';
  
  // 모든 콘솔 메시지 출력
  page.on('console', msg => {
    console.log(`[${msg.type()}]`, msg.text());
  });
  
  // 네트워크 요청 모니터링
  page.on('request', request => {
    if (request.url().includes('.js')) {
      console.log('JS 로드:', request.url());
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('form-script-supabase.js')) {
      console.log('form-script-supabase.js 응답:', response.status());
    }
  });
  
  console.log('1. form.html 접속');
  await page.goto(`${PRODUCTION_URL}form.html`, { waitUntil: 'networkidle' });
  
  console.log('2. 15초 대기');
  await page.waitForTimeout(15000);
  
  console.log('3. 전역 객체 확인');
  const globalCheck = await page.evaluate(() => {
    return {
      saveProperty: typeof window.saveProperty,
      supabaseClient: !!window.supabaseClient,
      insertProperty: typeof window.insertProperty,
      updateProperty: typeof window.updateProperty,
      deleteProperty: typeof window.deleteProperty
    };
  });
  
  console.log('전역 객체 상태:', globalCheck);
  
  // 직접 saveProperty 정의
  if (globalCheck.saveProperty === 'undefined') {
    console.log('4. saveProperty를 직접 정의 시도');
    
    await page.evaluate(() => {
      window.saveProperty = async function() {
        console.log('임시 saveProperty 호출됨');
        alert('임시 저장 함수가 호출되었습니다.');
      };
    });
    
    const afterDefine = await page.evaluate(() => typeof window.saveProperty);
    console.log('정의 후 saveProperty:', afterDefine);
  }
  
  console.log('5. 저장 버튼 클릭');
  
  page.on('dialog', async dialog => {
    console.log('Alert:', dialog.message());
    await dialog.accept();
  });
  
  await page.click('.btn-save');
  await page.waitForTimeout(5000);
  
  console.log('테스트 완료');
});