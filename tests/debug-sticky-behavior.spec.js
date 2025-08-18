import { test, expect } from '@playwright/test';

test('Sticky 작동 방식 디버깅', async ({ page }) => {
  console.log('🔍 Sticky 작동 방식 디버깅');
  
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('https://gma3561.github.io/The-realty_hasia/');
  await page.waitForTimeout(3000);
  
  // 스크롤 컨테이너 및 부모 요소들 확인
  const scrollInfo = await page.evaluate(() => {
    const thead = document.querySelector('.data-table thead');
    const table = document.querySelector('.data-table');
    const tableContainer = document.querySelector('.table-container');
    const body = document.body;
    
    function getElementInfo(element, name) {
      if (!element) return { name, exists: false };
      
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      
      return {
        name,
        exists: true,
        position: style.position,
        overflow: style.overflow,
        overflowY: style.overflowY,
        height: style.height,
        rect: { y: rect.y, height: rect.height },
        scrollTop: element.scrollTop,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight
      };
    }
    
    return {
      thead: getElementInfo(thead, 'thead'),
      table: getElementInfo(table, 'table'),
      tableContainer: getElementInfo(tableContainer, 'table-container'),
      body: getElementInfo(body, 'body')
    };
  });
  
  console.log('요소별 정보:', JSON.stringify(scrollInfo, null, 2));
  
  // 스크롤 후 위치 변화 확인
  await page.evaluate(() => {
    const container = document.querySelector('.table-container');
    if (container) {
      container.scrollTop = 200;
    }
  });
  
  await page.waitForTimeout(1000);
  
  const afterScrollRect = await page.locator('.data-table thead').boundingBox();
  console.log('스크롤 후 테이블 헤더 위치:', afterScrollRect);
});