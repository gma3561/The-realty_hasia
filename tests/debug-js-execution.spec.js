import { test, expect } from '@playwright/test';

test('JavaScript 실행 확인', async ({ page }) => {
  console.log('🔍 JavaScript 실행 확인');
  
  // 콘솔 로그 수집
  const logs = [];
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
    console.log(`브라우저 콘솔: ${msg.type()}: ${msg.text()}`);
  });
  
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('https://gma3561.github.io/The-realty_hasia/');
  await page.waitForTimeout(5000); // JavaScript 실행 대기
  
  // 테이블 헤더 위치 확인
  const tableHeaderRect = await page.locator('.data-table thead').boundingBox();
  console.log('테이블 헤더 위치:', tableHeaderRect);
  
  // 실제 스타일 값 확인
  const actualStyle = await page.evaluate(() => {
    const thead = document.querySelector('.data-table thead');
    if (!thead) return null;
    
    return {
      position: thead.style.position,
      top: thead.style.top,
      computedTop: window.getComputedStyle(thead).top,
      computedPosition: window.getComputedStyle(thead).position
    };
  });
  
  console.log('실제 스타일:', actualStyle);
  console.log('수집된 콘솔 로그:', logs);
});