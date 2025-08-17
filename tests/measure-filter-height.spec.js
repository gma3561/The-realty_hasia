import { test, expect } from '@playwright/test';

test('필터 바 높이 측정', async ({ page }) => {
  console.log('🔍 필터 바 높이 측정 시작');
  
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto('https://gma3561.github.io/The-realty_hasia/');
  await page.waitForTimeout(3000);
  
  // 각 요소의 위치와 크기 측정
  const header = await page.locator('.header').boundingBox();
  const filterBar = await page.locator('.filter-bar').boundingBox();
  const tableHeader = await page.locator('.data-table thead').boundingBox();
  
  console.log('앱 헤더:', header);
  console.log('필터 바:', filterBar);
  console.log('테이블 헤더:', tableHeader);
  
  if (header && filterBar) {
    const headerEnd = header.y + header.height;
    const filterStart = filterBar.y;
    const filterEnd = filterBar.y + filterBar.height;
    
    console.log(`헤더 끝: ${headerEnd}px`);
    console.log(`필터 바 시작: ${filterStart}px`);
    console.log(`필터 바 끝: ${filterEnd}px`);
    console.log(`필터 바 높이: ${filterBar.height}px`);
    console.log(`헤더+필터 총 높이: ${filterEnd}px`);
  }
  
  // 모바일에서도 측정
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('https://gma3561.github.io/The-realty_hasia/');
  await page.waitForTimeout(3000);
  
  const mobileHeader = await page.locator('.header').boundingBox();
  const mobileFilterBar = await page.locator('.filter-bar').boundingBox();
  const mobileTableHeader = await page.locator('.data-table thead').boundingBox();
  
  console.log('모바일 앱 헤더:', mobileHeader);
  console.log('모바일 필터 바:', mobileFilterBar);
  console.log('모바일 테이블 헤더:', mobileTableHeader);
  
  if (mobileHeader && mobileFilterBar) {
    const mobileHeaderEnd = mobileHeader.y + mobileHeader.height;
    const mobileFilterStart = mobileFilterBar.y;
    const mobileFilterEnd = mobileFilterBar.y + mobileFilterBar.height;
    
    console.log(`모바일 헤더 끝: ${mobileHeaderEnd}px`);
    console.log(`모바일 필터 바 시작: ${mobileFilterStart}px`);
    console.log(`모바일 필터 바 끝: ${mobileFilterEnd}px`);
    console.log(`모바일 필터 바 높이: ${mobileFilterBar.height}px`);
    console.log(`모바일 헤더+필터 총 높이: ${mobileFilterEnd}px`);
  }
});