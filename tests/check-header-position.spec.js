import { test, expect } from '@playwright/test';

test.describe('헤더 위치 확인', () => {
  test('테이블 헤더 위치 확인 - 데스크톱', async ({ page }) => {
    console.log('📌 데스크톱 헤더 위치 확인');
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('https://gma3561.github.io/The-realty_hasia/');
    await page.waitForTimeout(5000);
    
    // 앱 헤더 위치 확인
    const appHeader = page.locator('.header');
    const appHeaderBox = await appHeader.boundingBox();
    console.log('앱 헤더 위치:', appHeaderBox);
    
    // 테이블 헤더 위치 확인
    const tableHeader = page.locator('.data-table thead');
    const tableHeaderBox = await tableHeader.boundingBox();
    console.log('테이블 헤더 위치:', tableHeaderBox);
    
    // 페이지네이션 위치 확인
    const pagination = page.locator('.pagination-container');
    const paginationBox = await pagination.boundingBox();
    console.log('페이지네이션 위치:', paginationBox);
    
    // 뷰포트 정보
    const viewport = page.viewportSize();
    console.log('뷰포트:', viewport);
    
    // 위치 관계 확인
    if (appHeaderBox && tableHeaderBox) {
      const gap = tableHeaderBox.y - (appHeaderBox.y + appHeaderBox.height);
      console.log(`앱 헤더와 테이블 헤더 간격: ${gap}px`);
      
      if (gap < 0) {
        console.log('❌ 테이블 헤더가 앱 헤더와 겹침');
      } else if (gap > 20) {
        console.log('⚠️ 테이블 헤더가 너무 아래에 있음');
      } else {
        console.log('✅ 테이블 헤더 위치 적절');
      }
    }
    
    // 스크롤 테스트
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(1000);
    
    const tableHeaderAfterScroll = await page.locator('.data-table thead').boundingBox();
    console.log('스크롤 후 테이블 헤더 위치:', tableHeaderAfterScroll);
    
    if (tableHeaderAfterScroll && tableHeaderBox) {
      if (Math.abs(tableHeaderAfterScroll.y - tableHeaderBox.y) < 5) {
        console.log('✅ 스크롤 시 테이블 헤더가 고정됨');
      } else {
        console.log('❌ 스크롤 시 테이블 헤더가 움직임');
      }
    }
  });
  
  test('테이블 헤더 위치 확인 - 모바일', async ({ page }) => {
    console.log('📱 모바일 헤더 위치 확인');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('https://gma3561.github.io/The-realty_hasia/');
    await page.waitForTimeout(5000);
    
    // 앱 헤더 위치 확인
    const appHeader = page.locator('.header');
    const appHeaderBox = await appHeader.boundingBox();
    console.log('모바일 앱 헤더 위치:', appHeaderBox);
    
    // 테이블 헤더 위치 확인
    const tableHeader = page.locator('.data-table thead');
    const tableHeaderBox = await tableHeader.boundingBox();
    console.log('모바일 테이블 헤더 위치:', tableHeaderBox);
    
    // 페이지네이션 위치 확인
    const pagination = page.locator('.pagination-container');
    const paginationBox = await pagination.boundingBox();
    console.log('모바일 페이지네이션 위치:', paginationBox);
    
    // 뷰포트 정보
    const viewport = page.viewportSize();
    console.log('모바일 뷰포트:', viewport);
    
    // 위치 관계 확인
    if (appHeaderBox && tableHeaderBox) {
      const gap = tableHeaderBox.y - (appHeaderBox.y + appHeaderBox.height);
      console.log(`모바일 앱 헤더와 테이블 헤더 간격: ${gap}px`);
      
      if (gap < -10) {
        console.log('❌ 테이블 헤더가 앱 헤더와 겹침');
      } else if (gap > 30) {
        console.log('⚠️ 테이블 헤더가 너무 아래에 있음');
      } else {
        console.log('✅ 테이블 헤더 위치 적절');
      }
    }
    
    // 페이지네이션이 하단 고정인지 확인
    if (paginationBox && viewport) {
      const bottomGap = viewport.height - (paginationBox.y + paginationBox.height);
      console.log(`페이지네이션과 화면 하단 간격: ${bottomGap}px`);
      
      if (bottomGap < 5) {
        console.log('✅ 페이지네이션이 하단에 고정됨');
      } else {
        console.log('❌ 페이지네이션이 하단에 고정되지 않음');
      }
    }
    
    // 모바일 스크롤 테스트
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(1000);
    
    const tableHeaderAfterScroll = await page.locator('.data-table thead').boundingBox();
    const paginationAfterScroll = await page.locator('.pagination-container').boundingBox();
    
    console.log('모바일 스크롤 후 테이블 헤더:', tableHeaderAfterScroll);
    console.log('모바일 스크롤 후 페이지네이션:', paginationAfterScroll);
  });
  
  test('스크린샷 촬영', async ({ page }) => {
    console.log('📸 스크린샷 촬영');
    
    // 데스크톱 스크린샷
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('https://gma3561.github.io/The-realty_hasia/');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/desktop-header-check.png', fullPage: true });
    
    // 모바일 스크린샷
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('https://gma3561.github.io/The-realty_hasia/');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/mobile-header-check.png', fullPage: true });
    
    console.log('스크린샷 저장 완료');
  });
});